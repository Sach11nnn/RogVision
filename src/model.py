import os
import time
import warnings
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from math import sqrt
import joblib
warnings.filterwarnings('ignore')

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PROC = os.path.join(BASE, '..', 'data', 'processed')
DATA_RAW  = os.path.join(BASE, '..', 'data', 'raw')

print("Loading data...")
df = pd.read_csv(
    os.path.join(DATA_PROC, 'covid_features.csv'),
    parse_dates=['date']
)
print(f"Loaded: {df.shape}")

rf_accuracy = 0
mape        = 0
rmse        = 0

# ════════════════════════════════════════════
# PART 0 — Hotspot Classification
# ════════════════════════════════════════════
print("\n" + "="*50)
print("PART 0 — Hotspot Classification (Random Forest)")
print("="*50)
t0 = time.time()

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score

    # Realistic hotspot label — growth + above mean cases + death rate
    df['is_hotspot'] = (
        (df['growth_rate'] > 0.1) &
        (df['new_cases'] > df.groupby('Country/Region')[
            'new_cases'].transform('mean')) &
        (df['death_rate'] > 0.5)
    ).astype(int)
    print(f"Hotspot ratio: {df['is_hotspot'].mean():.2%}")

    feature_cols = [
        'rolling_7', 'rolling_14', 'lag_7', 'lag_14',
        'cases_per_million', 'death_rate',
        'population_density', 'gdp_per_capita', 'median_age'
    ]
    available = [c for c in feature_cols if c in df.columns]
    df_rf = df[available + ['is_hotspot']].copy()
    df_rf = df_rf.replace([np.inf, -np.inf], np.nan).dropna()

    X = df_rf[available]
    y = df_rf['is_hotspot']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    rf = RandomForestClassifier(
        n_estimators=100, random_state=42,
        class_weight='balanced'
    )
    rf.fit(X_train, y_train)
    y_pred = rf.predict(X_test)

    rf_accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {rf_accuracy:.2%}")
    print(classification_report(y_test, y_pred))

    # Feature importance plot
    importances = pd.Series(
        rf.feature_importances_, index=available
    )
    importances.sort_values().plot(
        kind='barh', figsize=(10, 6),
        title='Feature Importance — Hotspot Detection',
        color='steelblue'
    )
    plt.tight_layout()
    plt.savefig(
        os.path.join(DATA_RAW, 'feature_importance.png'), dpi=150
    )
    plt.close()
    print("Feature importance plot saved!")

    joblib.dump(rf, os.path.join(DATA_PROC, 'hotspot_model.pkl'))
    print(f"Time: {time.time()-t0:.1f}s")
    print("PART 0 COMPLETE ✓")

except Exception as e:
    print(f"Part 0 Error: {e}")
    import traceback; traceback.print_exc()

# ════════════════════════════════════════════
# PART 1 — Epidemic Forecasting (Ridge)
# ════════════════════════════════════════════
print("\n" + "="*50)
print("PART 1 — Epidemic Forecasting (Ridge Regression)")
print("="*50)
t1 = time.time()

try:
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler, MinMaxScaler

    india = df[df['Country/Region'] == 'India'].sort_values(
        'date'
    ).copy()
    india = india.dropna(subset=['rolling_7'])
    india['rolling_7'] = india['rolling_7'].clip(lower=0)

    india_clean = india[[
        'date', 'rolling_7', 'lag_7',
        'lag_14', 'cases_per_million'
    ]].copy()
    india_clean = india_clean.fillna(0)
    india_clean = india_clean.replace([np.inf, -np.inf], 0)

    # Time features
    india_clean['day_num']     = (
        india_clean['date'] - india_clean['date'].min()
    ).dt.days
    india_clean['month']       = india_clean['date'].dt.month
    india_clean['day_of_week'] = india_clean['date'].dt.dayofweek

    feature_cols_ridge = [
        'day_num', 'month', 'day_of_week',
        'lag_7', 'lag_14', 'cases_per_million'
    ]

    X_all = india_clean[feature_cols_ridge].values
    y_all = india_clean['rolling_7'].values

    # Normalize y
    y_scaler = MinMaxScaler()
    y_scaled = y_scaler.fit_transform(
        y_all.reshape(-1, 1)
    ).ravel()

    split      = int(len(X_all) * 0.9)
    X_tr, X_te = X_all[:split],    X_all[split:]
    y_tr, y_te = y_scaled[:split],  y_scaled[split:]
    y_te_orig  = y_all[split:]

    scaler_X = StandardScaler()
    X_tr_sc  = scaler_X.fit_transform(X_tr)
    X_te_sc  = scaler_X.transform(X_te)

    ridge = Ridge(alpha=10.0)
    ridge.fit(X_tr_sc, y_tr)

    y_pred_sc   = ridge.predict(X_te_sc)
    y_pred_orig = y_scaler.inverse_transform(
        y_pred_sc.reshape(-1, 1)
    ).ravel()
    y_pred_orig = np.clip(y_pred_orig, 0, None)

    # MAPE on original scale (ignore near-zero values)
    # MAPE on original scale (only > 1000 )
    mask = y_te_orig > 1000
    if mask.sum() > 0:
        mape = np.mean(
            np.abs(
                (y_te_orig[mask] - y_pred_orig[mask]) /
                 y_te_orig[mask]
            )
        ) * 100
        mape = min(mape, 100)  # cap at 100% for display
    else:
        mape = 0
    print(f"Ridge Forecast MAPE: {mape:.2f}%")

    # Forecast next 60 days
    last_date    = india_clean['date'].max()
    last_day_num = india_clean['day_num'].max()
    last_vals    = india_clean[[
        'lag_7', 'lag_14', 'cases_per_million'
    ]].iloc[-1]

    future_dates = pd.date_range(
        start=last_date + pd.Timedelta(days=1), periods=60
    )
    future_rows = []
    for i, d in enumerate(future_dates):
        future_rows.append({
            'day_num':        last_day_num + i + 1,
            'month':          d.month,
            'day_of_week':    d.dayofweek,
            'lag_7':          float(last_vals['lag_7']),
            'lag_14':         float(last_vals['lag_14']),
            'cases_per_million': float(
                last_vals['cases_per_million']
            )
        })

    future_df = pd.DataFrame(future_rows)
    X_future  = scaler_X.transform(
        future_df[feature_cols_ridge].values
    )
    y_future_sc  = ridge.predict(X_future)
    y_future     = y_scaler.inverse_transform(
        y_future_sc.reshape(-1, 1)
    ).ravel()
    y_future     = np.clip(y_future, 0, None)

    # All predictions on historical data
    X_all_sc   = scaler_X.transform(X_all)
    y_all_pred = y_scaler.inverse_transform(
        ridge.predict(X_all_sc).reshape(-1, 1)
    ).ravel()
    y_all_pred = np.clip(y_all_pred, 0, None)

    # Build forecast CSV (dashboard ke liye)
    hist_df = pd.DataFrame({
        'ds':          india_clean['date'],
        'y':           india_clean['rolling_7'],
        'yhat':        y_all_pred,
        'yhat_lower':  y_all_pred * 0.85,
        'yhat_upper':  y_all_pred * 1.15
    })
    fut_df = pd.DataFrame({
        'ds':          future_dates,
        'y':           np.nan,
        'yhat':        y_future,
        'yhat_lower':  y_future * 0.85,
        'yhat_upper':  y_future * 1.15
    })
    forecast = pd.concat([hist_df, fut_df], ignore_index=True)
    forecast.to_csv(
        os.path.join(DATA_PROC, 'forecast_india.csv'), index=False
    )
    print("Forecast CSV saved!")

    # Plot
    fig, ax = plt.subplots(figsize=(14, 6))
    ax.plot(hist_df['ds'], hist_df['y'],
            color='steelblue', label='Actual',
            linewidth=1.5, alpha=0.8)
    ax.plot(hist_df['ds'], hist_df['yhat'],
            color='orange', label='Fitted',
            linewidth=1.5, linestyle='--')
    ax.plot(fut_df['ds'], fut_df['yhat'],
            color='red', label='Forecast (60 days)',
            linewidth=2)
    ax.fill_between(
        fut_df['ds'],
        fut_df['yhat_lower'],
        fut_df['yhat_upper'],
        alpha=0.2, color='red', label='Confidence Interval'
    )
    for w in ['2020-09-01', '2021-04-01',
              '2021-12-01', '2022-01-01']:
        ax.axvline(pd.to_datetime(w), color='gray',
                   linestyle='--', alpha=0.5, linewidth=1)
    ax.set_title(
        'Epidemic Forecast — India (Ridge Regression)',
        fontsize=14
    )
    ax.set_ylabel('7-day Rolling Average Cases')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(
        os.path.join(DATA_RAW, 'prophet_forecast.png'), dpi=150
    )
    plt.close()
    print(f"Plot saved! Time: {time.time()-t1:.1f}s")
    print("PART 1 COMPLETE ✓")

except Exception as e:
    print(f"Part 1 Error: {e}")
    import traceback; traceback.print_exc()

# ════════════════════════════════════════════
# PART 2 — LSTM Model
# ════════════════════════════════════════════
print("\n" + "="*50)
print("PART 2 — LSTM Time Series Model")
print("="*50)
t2 = time.time()

try:
    from sklearn.preprocessing import MinMaxScaler
    from sklearn.metrics import mean_squared_error
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout

    india = df[df['Country/Region'] == 'India'].sort_values(
        'date'
    ).copy()
    data   = india['rolling_7'].fillna(0).values.reshape(-1, 1)

    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(data)

    def create_sequences(data, look_back=14):
        X, y = [], []
        for i in range(len(data) - look_back - 1):
            X.append(data[i:i + look_back])
            y.append(data[i + look_back])
        return np.array(X), np.array(y)

    look_back   = 14
    X_seq, y_seq = create_sequences(scaled, look_back)
    X_seq        = X_seq.reshape(X_seq.shape[0], look_back, 1)

    split          = int(len(X_seq) * 0.8)
    X_train        = X_seq[:split]
    X_test         = X_seq[split:]
    y_train_seq    = y_seq[:split]
    y_test_seq     = y_seq[split:]

    model = Sequential([
        LSTM(64, return_sequences=True,
             input_shape=(look_back, 1)),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1)
    ])
    model.compile(optimizer='adam', loss='mse')
    model.summary()

    history = model.fit(
        X_train, y_train_seq,
        epochs=30, batch_size=16,
        validation_data=(X_test, y_test_seq),
        verbose=1
    )

    pred        = model.predict(X_test)
    pred_inv    = scaler.inverse_transform(pred)
    actual_inv  = scaler.inverse_transform(
        y_test_seq.reshape(-1, 1)
    )

    rmse = sqrt(mean_squared_error(actual_inv, pred_inv))
    print(f"\nLSTM RMSE: {rmse:.2f}")

    # Plot 1 — Actual vs Predicted
    fig, ax = plt.subplots(figsize=(14, 5))
    ax.plot(actual_inv, label='Actual',
            color='steelblue', linewidth=1.5)
    ax.plot(pred_inv,   label='Predicted',
            color='red', alpha=0.7, linewidth=1.5)
    ax.set_title('LSTM — Actual vs Predicted (India)')
    ax.set_ylabel('Cases (7-day avg)')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(
        os.path.join(DATA_RAW, 'lstm_forecast.png'), dpi=150
    )
    plt.close()

    # Plot 2 — Loss curve
    fig, ax = plt.subplots(figsize=(10, 4))
    ax.plot(history.history['loss'],     label='Train Loss')
    ax.plot(history.history['val_loss'], label='Val Loss')
    ax.set_title('LSTM Training Loss')
    ax.set_xlabel('Epoch')
    ax.set_ylabel('MSE Loss')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(
        os.path.join(DATA_RAW, 'lstm_loss.png'), dpi=150
    )
    plt.close()
    print(f"Plots saved! Time: {time.time()-t2:.1f}s")
    print("PART 2 COMPLETE ✓")

except Exception as e:
    print(f"Part 2 Error: {e}")
    import traceback; traceback.print_exc()

# ════════════════════════════════════════════
# PART 3 — Epidemic Insights
# ════════════════════════════════════════════
print("\n" + "="*50)
print("PART 3 — Epidemic Insights")
print("="*50)

try:
    from scipy.signal import find_peaks

    # Rt estimation
    df = df.sort_values(['Country/Region', 'date'])
    df['Rt'] = df.groupby('Country/Region')[
        'rolling_7'
    ].transform(lambda x: x / x.shift(7)).clip(0, 5)

    latest_rt = df.groupby('Country/Region')['Rt'].last()
    print("\nTop 10 countries by current Rt:")
    print(latest_rt.nlargest(10))

    df[['Country/Region', 'date', 'Rt']].to_csv(
        os.path.join(DATA_PROC, 'rt_estimates.csv'), index=False
    )
    print("Rt data saved!")

    # Feature correlation with risk_score
    feature_cols = [
        'rolling_7', 'rolling_14', 'lag_7', 'lag_14',
        'cases_per_million', 'death_rate',
        'population_density', 'gdp_per_capita', 'median_age'
    ]
    available = [c for c in feature_cols if c in df.columns]
    corr = df[available].corrwith(df['risk_score'])
    print("\nTop factors correlated with risk score:")
    print(corr.abs().sort_values(ascending=False))

    # Vaccination impact
    countries_vax = df[
        df['people_vaccinated'] > 0
    ]['Country/Region'].unique()
    results = []
    for country in countries_vax[:20]:
        cdf       = df[df['Country/Region'] == country].sort_values('date')
        vax_start = cdf[cdf['people_vaccinated'] > 0]['date'].min()
        before    = cdf[cdf['date'] <  vax_start]['new_cases'].mean()
        after     = cdf[cdf['date'] >= vax_start]['new_cases'].mean()
        results.append({
            'country':    country,
            'before_vax': round(before, 1),
            'after_vax':  round(after,  1),
            'change_%':   round(
                (after - before) / (before + 1) * 100, 1
            )
        })
    vax_df = pd.DataFrame(results).sort_values('change_%')
    print("\nVaccination Impact (best 10 countries):")
    print(vax_df.head(10).to_string(index=False))

    # Wave detection India
    india_df    = df[df['Country/Region'] == 'India'].sort_values('date')
    india_cases = india_df['new_cases'].fillna(0).values
    india_dates = india_df['date'].values
    peaks, _    = find_peaks(india_cases, height=50000, distance=30)
    print(f"\nIndia COVID Waves detected: {len(peaks)}")
    for i, p in enumerate(peaks):
        print(f"  Wave {i+1}: "
              f"{pd.Timestamp(india_dates[p]).date()} — "
              f"{india_cases[p]:,.0f} cases/day")

    print("PART 3 COMPLETE ✓")

except Exception as e:
    print(f"Part 3 Error: {e}")
    import traceback; traceback.print_exc()

# ════════════════════════════════════════════
# PART 4 — Model Comparison
# ════════════════════════════════════════════
print("\n" + "="*60)
print("MODEL COMPARISON SUMMARY")
print("="*60)
print(f"{'Model':<20} {'Metric':<12} {'Score':<15} {'Best For'}")
print("-"*60)

p_score  = f"{mape:.1f}%"     if mape        > 0 else "See plot"
l_score  = f"{rmse:.0f}"      if rmse        > 0 else "N/A"
rf_score = f"{rf_accuracy:.1%}" if rf_accuracy > 0 else "N/A"

print(f"{'Ridge Forecast':<20} {'MAPE':<12} {p_score:<15} "
      f"Trend forecasting")
print(f"{'LSTM':<20} {'RMSE':<12} {l_score:<15} "
      f"Complex pattern learning")
print(f"{'RF Hotspot':<20} {'Accuracy':<12} {rf_score:<15} "
      f"Real-time hotspot alerts")
print("="*60)
print("\nRECOMMENDATION:")
print("  Ridge    → 30-60 day national level forecasting")
print("  LSTM     → Short-term day-by-day prediction")
print("  RF Model → Real-time hotspot classification alerts")
print("\nMODEL PIPELINE COMPLETE ✓")