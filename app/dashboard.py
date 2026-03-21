import os
import warnings
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dash import Dash, html, dcc, Input, Output, callback
import dash_bootstrap_components as dbc
warnings.filterwarnings('ignore')

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PROC = os.path.join(BASE, '..', 'data', 'processed')

# ════════════════════════════════════════════
# DATA LOADING
# ════════════════════════════════════════════
df = pd.read_csv(
    os.path.join(DATA_PROC, 'covid_features.csv'),
    parse_dates=['date']
)
forecast = pd.read_csv(
    os.path.join(DATA_PROC, 'forecast_india.csv'),
    parse_dates=['ds']
)
rt = pd.read_csv(
    os.path.join(DATA_PROC, 'rt_estimates.csv'),
    parse_dates=['date']
)

latest = (
    df.sort_values('date')
      .groupby('Country/Region')
      .last()
      .reset_index()
)
rt_latest = (
    rt.sort_values('date')
       .groupby('Country/Region')
       .last()
       .reset_index()[['Country/Region','Rt']]
)
latest = latest.merge(rt_latest, on='Country/Region', how='left')

def risk_label(s):
    if s >= 66:   return 'High'
    elif s >= 33: return 'Medium'
    return 'Low'

latest['risk_level'] = latest['risk_score'].apply(risk_label)

COUNTRIES = sorted(df['Country/Region'].unique())

# ════════════════════════════════════════════
# APP INIT
# ════════════════════════════════════════════
app = Dash(
    __name__,
    external_stylesheets=[
        dbc.themes.CYBORG,        # dark pro theme
        dbc.icons.FONT_AWESOME
    ],
    suppress_callback_exceptions=True
)
app.title = "Epidemic Prediction System"

# ════════════════════════════════════════════
# COLORS
# ════════════════════════════════════════════
COLORS = {
    'bg':       '#0d1117',
    'card':     '#161b22',
    'border':   '#30363d',
    'accent':   '#58a6ff',
    'danger':   '#f85149',
    'success':  '#3fb950',
    'warning':  '#d29922',
    'text':     '#c9d1d9',
    'muted':    '#8b949e',
}

CARD_STYLE = {
    'background':   COLORS['card'],
    'border':       f"1px solid {COLORS['border']}",
    'borderRadius': '12px',
    'padding':      '20px',
    'marginBottom': '16px',
}

METRIC_STYLE = {
    'background':   COLORS['card'],
    'border':       f"1px solid {COLORS['border']}",
    'borderRadius': '12px',
    'padding':      '20px',
    'textAlign':    'center',
}

PLOT_LAYOUT = dict(
    paper_bgcolor='rgba(0,0,0,0)',
    plot_bgcolor='rgba(0,0,0,0)',
    font=dict(color=COLORS['text'], family='Inter, sans-serif'),
    margin=dict(l=10, r=10, t=40, b=10),
    xaxis=dict(
        gridcolor=COLORS['border'],
        showgrid=True
    ),
    yaxis=dict(
        gridcolor=COLORS['border'],
        showgrid=True
    ),
    legend=dict(
        bgcolor='rgba(0,0,0,0)',
        bordercolor=COLORS['border']
    ),
    hovermode='x unified'
)

# ════════════════════════════════════════════
# SIDEBAR
# ════════════════════════════════════════════
SIDEBAR = html.Div([
    html.Div([
        html.Span("🦠", style={'fontSize':'32px'}),
        html.H5(
            "Epidemic Prediction System",
            style={
                'color': COLORS['accent'],
                'margin': '8px 0 4px',
                'fontWeight': '700'
            }
        ),
        html.P(
            "SPIRIT 2026 | IIT-BHU | CodeCure",
            style={
                'color':    COLORS['muted'],
                'fontSize': '11px',
                'margin':   0
            }
        ),
    ], style={'marginBottom':'24px'}),

    html.Hr(style={'borderColor': COLORS['border']}),

    html.P(
        "NAVIGATION",
        style={
            'color':       COLORS['muted'],
            'fontSize':    '11px',
            'letterSpacing':'2px',
            'margin':      '12px 0 8px'
        }
    ),

    dbc.Nav([
        dbc.NavLink(
            [html.I(className="fa fa-globe me-2"),
             "Global Overview"],
            href="/", active="exact",
            style={'color': COLORS['text'],
                   'borderRadius': '8px',
                   'marginBottom': '4px'}
        ),
        dbc.NavLink(
            [html.I(className="fa fa-microscope me-2"),
             "Country Deep Dive"],
            href="/country", active="exact",
            style={'color': COLORS['text'],
                   'borderRadius': '8px',
                   'marginBottom': '4px'}
        ),
        dbc.NavLink(
            [html.I(className="fa fa-chart-line me-2"),
             "Forecast"],
            href="/forecast", active="exact",
            style={'color': COLORS['text'],
                   'borderRadius': '8px',
                   'marginBottom': '4px'}
        ),
        dbc.NavLink(
            [html.I(className="fa fa-flask me-2"),
             "What-If Simulator"],
            href="/simulator", active="exact",
            style={'color': COLORS['text'],
                   'borderRadius': '8px',
                   'marginBottom': '4px'}
        ),
        dbc.NavLink(
            [html.I(className="fa fa-bell me-2"),
             "Hotspot Analysis"],
            href="/hotspot", active="exact",
            style={'color': COLORS['text'],
                   'borderRadius': '8px',
                   'marginBottom': '4px'}
        ),
    ], vertical=True, pills=True),

    html.Hr(style={'borderColor': COLORS['border']}),

    # Stats
    html.Div([
        html.P("SYSTEM STATS", style={
            'color': COLORS['muted'],
            'fontSize': '11px',
            'letterSpacing': '2px'
        }),
        html.P(
            f"Countries: {df['Country/Region'].nunique()}",
            style={'color': COLORS['text'], 'fontSize': '13px',
                   'margin': '4px 0'}
        ),
        html.P(
            f"Date Range: {df['date'].min().date()} → "
            f"{df['date'].max().date()}",
            style={'color': COLORS['text'], 'fontSize': '12px',
                   'margin': '4px 0'}
        ),
        html.P(
            f"High Risk: "
            f"{len(latest[latest['risk_level']=='High'])} countries",
            style={'color': COLORS['danger'], 'fontSize': '13px',
                   'fontWeight': '600', 'margin': '4px 0'}
        ),
    ]),
], style={
    'position':   'fixed',
    'top':        0,
    'left':       0,
    'bottom':     0,
    'width':      '240px',
    'padding':    '24px 16px',
    'background': COLORS['bg'],
    'borderRight':f"1px solid {COLORS['border']}",
    'overflowY':  'auto',
    'zIndex':     1000
})

# ════════════════════════════════════════════
# LAYOUT
# ════════════════════════════════════════════
app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    SIDEBAR,
    html.Div(
        id='page-content',
        style={
            'marginLeft': '256px',
            'padding':    '24px',
            'minHeight':  '100vh',
            'background': COLORS['bg'],
            'color':      COLORS['text'],
        }
    )
], style={'background': COLORS['bg']})


# ════════════════════════════════════════════
# HELPER — Metric Card
# ════════════════════════════════════════════
def metric_card(title, value, color=None, subtitle=None):
    return html.Div([
        html.P(title, style={
            'color':    COLORS['muted'],
            'fontSize': '12px',
            'margin':   '0 0 4px',
            'letterSpacing': '1px'
        }),
        html.H3(value, style={
            'color':      color or COLORS['accent'],
            'margin':     '0',
            'fontWeight': '700'
        }),
        html.P(subtitle or '', style={
            'color':    COLORS['muted'],
            'fontSize': '11px',
            'margin':   '4px 0 0'
        }),
    ], style=METRIC_STYLE)


# ════════════════════════════════════════════
# PAGE 1 — GLOBAL OVERVIEW
# ════════════════════════════════════════════
def page_global():
    total_cases  = latest['confirmed'].sum()
    total_deaths = latest['deaths'].sum()
    high_risk    = len(latest[latest['risk_level'] == 'High'])
    avg_rt       = latest['Rt'].mean()

    # Choropleth
    fig_map = px.choropleth(
        latest,
        locations='Country/Region',
        locationmode='country names',
        color='risk_score',
        color_continuous_scale='RdYlGn_r',
        hover_data={
            'confirmed':  ':,.0f',
            'death_rate': ':.2f',
            'risk_score': ':.1f',
            'risk_level': True,
        },
        height=450
    )
    fig_map.update_layout(
        **PLOT_LAYOUT,
        geo=dict(
            bgcolor='rgba(0,0,0,0)',
            lakecolor='rgba(0,0,0,0)',
            landcolor='#21262d',
            showland=True,
            showcountries=True,
            countrycolor=COLORS['border']
        ),
        coloraxis_colorbar=dict(
            title='Risk',
            tickvals=[0, 33, 66, 100],
            ticktext=['Low','Medium','High','Critical'],
            bgcolor=COLORS['card'],
            tickfont=dict(color=COLORS['text'])
        )
    )

    # Top 10 bar
    top10 = latest.nlargest(10, 'risk_score')
    fig_bar = px.bar(
        top10, x='risk_score', y='Country/Region',
        orientation='h',
        color='risk_score',
        color_continuous_scale='Reds',
        text='risk_score', height=360
    )
    fig_bar.update_traces(
        texttemplate='%{text:.1f}',
        textposition='outside'
    )
    fig_bar.update_layout(
        **PLOT_LAYOUT,
        yaxis={'categoryorder': 'total ascending'},
        showlegend=False,
        title='Top 10 High Risk Countries'
    )

    # Global trend
    gtrend = df.groupby('date')['new_cases'].sum().reset_index()
    gtrend['rolling_7'] = gtrend['new_cases'].rolling(7).mean()
    fig_trend = go.Figure()
    fig_trend.add_trace(go.Scatter(
        x=gtrend['date'], y=gtrend['new_cases'],
        name='Daily', line=dict(color=COLORS['accent'], width=1),
        opacity=0.4
    ))
    fig_trend.add_trace(go.Scatter(
        x=gtrend['date'], y=gtrend['rolling_7'],
        name='7-day Avg',
        line=dict(color=COLORS['accent'], width=2.5)
    ))
    fig_trend.update_layout(
        **PLOT_LAYOUT,
        title='Global Daily New Cases',
        height=300
    )

    # Risk pie
    rc = latest['risk_level'].value_counts()
    fig_pie = px.pie(
        values=rc.values, names=rc.index,
        color=rc.index,
        color_discrete_map={
            'High':   COLORS['danger'],
            'Medium': COLORS['warning'],
            'Low':    COLORS['success']
        },
        height=300, hole=0.4
    )
    fig_pie.update_layout(
        **PLOT_LAYOUT,
        title='Risk Distribution'
    )

    return html.Div([
        html.H2("🌍 Global Epidemic Overview",
                style={'color': COLORS['accent'],
                       'marginBottom': '20px'}),

        # Metrics row
        dbc.Row([
            dbc.Col(metric_card(
                "TOTAL CASES",
                f"{total_cases/1e6:.1f}M",
                COLORS['accent']
            ), width=3),
            dbc.Col(metric_card(
                "TOTAL DEATHS",
                f"{total_deaths/1e6:.2f}M",
                COLORS['danger']
            ), width=3),
            dbc.Col(metric_card(
                "HIGH RISK COUNTRIES",
                str(high_risk),
                COLORS['danger'],
                "Needs immediate attention"
            ), width=3),
            dbc.Col(metric_card(
                "AVG GLOBAL Rt",
                f"{avg_rt:.2f}",
                COLORS['warning'] if avg_rt > 1
                else COLORS['success'],
                "Above 1 = spreading"
            ), width=3),
        ], className='mb-3'),

        # Map
        html.Div([
            dcc.Graph(figure=fig_map)
        ], style=CARD_STYLE),

        # Bar + Pie
        dbc.Row([
            dbc.Col(
                html.Div([dcc.Graph(figure=fig_bar)],
                         style=CARD_STYLE), width=7
            ),
            dbc.Col(
                html.Div([dcc.Graph(figure=fig_pie)],
                         style=CARD_STYLE), width=5
            ),
        ]),

        # Trend
        html.Div([dcc.Graph(figure=fig_trend)],
                 style=CARD_STYLE),
    ])


# ════════════════════════════════════════════
# PAGE 2 — COUNTRY DEEP DIVE
# ════════════════════════════════════════════
def page_country():
    return html.Div([
        html.H2("🔬 Country Deep Dive",
                style={'color': COLORS['accent'],
                       'marginBottom': '20px'}),
        html.Div([
            dcc.Dropdown(
                id='country-select',
                options=[{'label': c, 'value': c}
                         for c in COUNTRIES],
                value='India',
                style={
                    'background': COLORS['card'],
                    'color':      COLORS['text'],
                    'border':     f"1px solid {COLORS['border']}"
                }
            )
        ], style={**CARD_STYLE, 'padding': '12px'}),

        html.Div(id='country-metrics'),
        html.Div(id='country-charts'),
    ])


# ════════════════════════════════════════════
# PAGE 3 — FORECAST
# ════════════════════════════════════════════
def page_forecast():
    hist   = forecast.dropna(subset=['y'])
    future = forecast[forecast['y'].isna()]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=hist['ds'], y=hist['y'],
        name='Actual',
        line=dict(color=COLORS['accent'], width=2)
    ))
    fig.add_trace(go.Scatter(
        x=hist['ds'], y=hist['yhat'],
        name='Model Fit',
        line=dict(color=COLORS['warning'],
                  width=1.5, dash='dash')
    ))
    fig.add_trace(go.Scatter(
        x=future['ds'], y=future['yhat'],
        name='Forecast',
        line=dict(color=COLORS['danger'], width=2.5)
    ))
    fig.add_trace(go.Scatter(
        x=pd.concat([future['ds'],
                     future['ds'].iloc[::-1]]),
        y=pd.concat([future['yhat_upper'],
                     future['yhat_lower'].iloc[::-1]]),
        fill='toself',
        fillcolor='rgba(248,81,73,0.15)',
        line=dict(color='rgba(0,0,0,0)'),
        name='Confidence Interval'
    ))
    for label, date in [
        ('Wave 1','2020-09-01'),
        ('Wave 2','2021-04-01'),
        ('Omicron','2022-01-01')
    ]:
        fig.add_vline(
            x=date, line_dash='dot',
            line_color=COLORS['muted'],
            opacity=0.6,
            annotation_text=label,
            annotation_font_color=COLORS['muted']
        )
    fig.update_layout(
        **PLOT_LAYOUT,
        title='Epidemic Forecast — India (60 days ahead)',
        height=500,
        yaxis_title='7-day Rolling Avg Cases'
    )

    # Next 7 days table
    n7 = future.head(7)[
        ['ds','yhat','yhat_lower','yhat_upper']
    ].copy()
    n7.columns = ['Date','Predicted','Lower','Upper']
    n7['Date']      = n7['Date'].dt.date
    n7['Predicted'] = n7['Predicted'].round(0).astype(int)
    n7['Lower']     = n7['Lower'].round(0).astype(int)
    n7['Upper']     = n7['Upper'].round(0).astype(int)

    table_rows = [
        html.Tr([
            html.Th("Date"), html.Th("Predicted"),
            html.Th("Lower"), html.Th("Upper")
        ], style={'color': COLORS['muted'],
                  'borderBottom': f"1px solid {COLORS['border']}"}
        )
    ] + [
        html.Tr([
            html.Td(str(row['Date'])),
            html.Td(f"{row['Predicted']:,}",
                    style={'color': COLORS['accent'],
                           'fontWeight': '600'}),
            html.Td(f"{row['Lower']:,}",
                    style={'color': COLORS['success']}),
            html.Td(f"{row['Upper']:,}",
                    style={'color': COLORS['danger']}),
        ], style={
            'borderBottom': f"1px solid {COLORS['border']}",
            'padding': '8px'
        })
        for _, row in n7.iterrows()
    ]

    return html.Div([
        html.H2("📈 Epidemic Forecast",
                style={'color': COLORS['accent'],
                       'marginBottom': '20px'}),
        html.Div([
            html.P(
                "Ridge Regression model with time-series "
                "lag features — 60 day forecast for India",
                style={'color': COLORS['muted'],
                       'margin': 0}
            )
        ], style={**CARD_STYLE, 'padding': '12px'}),

        html.Div([dcc.Graph(figure=fig)], style=CARD_STYLE),

        html.Div([
            html.H5("Next 7 Days Predicted Cases",
                    style={'color': COLORS['text'],
                           'marginBottom': '12px'}),
            html.Table(
                table_rows,
                style={'width': '100%',
                       'borderCollapse': 'collapse',
                       'color': COLORS['text']}
            )
        ], style=CARD_STYLE),
    ])


# ════════════════════════════════════════════
# PAGE 4 — WHAT-IF SIMULATOR
# ════════════════════════════════════════════
def page_simulator():
    return html.Div([
        html.H2("🧪 What-If Epidemic Simulator",
                style={'color': COLORS['accent'],
                       'marginBottom': '20px'}),
        html.P(
            "Simulate epidemic spread using the SIR "
            "compartmental model — adjust parameters "
            "and see real-time impact.",
            style={'color': COLORS['muted'],
                   'marginBottom': '20px'}
        ),

        # Controls
        html.Div([
            dbc.Row([
                dbc.Col([
                    html.Label("R-value (Reproduction Number)",
                               style={'color': COLORS['muted'],
                                      'fontSize': '12px'}),
                    dcc.Slider(
                        id='r-slider',
                        min=0.5, max=3.0,
                        step=0.1, value=1.2,
                        marks={
                            0.5: {'label': '0.5',
                                  'style': {'color':
                                            COLORS['success']}},
                            1.0: {'label': '1.0',
                                  'style': {'color':
                                            COLORS['warning']}},
                            2.0: {'label': '2.0',
                                  'style': {'color':
                                            COLORS['danger']}},
                            3.0: {'label': '3.0',
                                  'style': {'color':
                                            COLORS['danger']}},
                        },
                        tooltip={
                            "placement": "bottom",
                            "always_visible": True
                        }
                    ),
                ], width=4),
                dbc.Col([
                    html.Label("Vaccination Rate (%)",
                               style={'color': COLORS['muted'],
                                      'fontSize': '12px'}),
                    dcc.Slider(
                        id='vax-slider',
                        min=0, max=100,
                        step=5, value=30,
                        marks={
                            0:   {'label': '0%'},
                            50:  {'label': '50%'},
                            100: {'label': '100%'}
                        },
                        tooltip={
                            "placement": "bottom",
                            "always_visible": True
                        }
                    ),
                ], width=4),
                dbc.Col([
                    html.Label("Days to Simulate",
                               style={'color': COLORS['muted'],
                                      'fontSize': '12px'}),
                    dcc.Slider(
                        id='days-slider',
                        min=30, max=365,
                        step=10, value=90,
                        marks={
                            30:  {'label': '30'},
                            180: {'label': '180'},
                            365: {'label': '365'}
                        },
                        tooltip={
                            "placement": "bottom",
                            "always_visible": True
                        }
                    ),
                ], width=4),
            ])
        ], style=CARD_STYLE),

        # Output
        html.Div(id='sir-output'),
    ])


# ════════════════════════════════════════════
# PAGE 5 — HOTSPOT
# ════════════════════════════════════════════
def page_hotspot():
    hotspots = latest.replace([np.inf, -np.inf], np.nan)
    top20    = hotspots.nlargest(20, 'risk_score')

    fig_hs = px.bar(
        top20, x='Country/Region', y='risk_score',
        color='risk_level',
        color_discrete_map={
            'High':   COLORS['danger'],
            'Medium': COLORS['warning'],
            'Low':    COLORS['success']
        },
        text='risk_score', height=400,
        title='Top 20 Countries by Risk Score'
    )
    fig_hs.update_traces(
        texttemplate='%{text:.1f}',
        textposition='outside'
    )
    fig_hs.update_layout(
        **PLOT_LAYOUT,
        xaxis_tickangle=-45
    )

    # Scatter
    scatter_df = hotspots.dropna(subset=['Rt']).head(50)
    fig_sc = px.scatter(
        scatter_df,
        x='Rt', y='risk_score',
        color='risk_level',
        size='new_cases',
        hover_name='Country/Region',
        color_discrete_map={
            'High':   COLORS['danger'],
            'Medium': COLORS['warning'],
            'Low':    COLORS['success']
        },
        height=400,
        title='Rt vs Risk Score'
    )
    fig_sc.add_vline(
        x=1, line_dash='dash',
        line_color=COLORS['danger'],
        annotation_text='Rt = 1',
        annotation_font_color=COLORS['danger']
    )
    fig_sc.update_layout(**PLOT_LAYOUT)

    # Table
    cols = ['Country/Region','risk_score','risk_level',
            'new_cases','death_rate','Rt','cases_per_million']
    available = [c for c in cols if c in hotspots.columns]
    tbl = hotspots[available].nlargest(20, 'risk_score')

    table_header = html.Tr([
        html.Th(c, style={
            'color':         COLORS['muted'],
            'fontSize':      '12px',
            'padding':       '8px',
            'borderBottom':  f"1px solid {COLORS['border']}",
            'letterSpacing': '1px'
        }) for c in available
    ])
    table_body = [
        html.Tr([
            html.Td(
                str(row[c]) if isinstance(row[c], str)
                else f"{row[c]:.1f}" if isinstance(
                    row[c], float) else str(row[c]),
                style={
                    'padding': '8px',
                    'color': (
                        COLORS['danger']
                        if c == 'risk_level'
                        and row[c] == 'High'
                        else COLORS['warning']
                        if c == 'risk_level'
                        and row[c] == 'Medium'
                        else COLORS['text']
                    ),
                    'borderBottom':
                        f"1px solid {COLORS['border']}"
                }
            ) for c in available
        ]) for _, row in tbl.iterrows()
    ]

    return html.Div([
        html.H2("🚨 Hotspot Analysis",
                style={'color': COLORS['accent'],
                       'marginBottom': '20px'}),

        dbc.Row([
            dbc.Col(metric_card(
                "HIGH RISK",
                str(len(latest[latest['risk_level']=='High'])),
                COLORS['danger']
            ), width=4),
            dbc.Col(metric_card(
                "MEDIUM RISK",
                str(len(latest[latest['risk_level']=='Medium'])),
                COLORS['warning']
            ), width=4),
            dbc.Col(metric_card(
                "LOW RISK",
                str(len(latest[latest['risk_level']=='Low'])),
                COLORS['success']
            ), width=4),
        ], className='mb-3'),

        dbc.Row([
            dbc.Col(
                html.Div([dcc.Graph(figure=fig_hs)],
                         style=CARD_STYLE), width=7
            ),
            dbc.Col(
                html.Div([dcc.Graph(figure=fig_sc)],
                         style=CARD_STYLE), width=5
            ),
        ]),

        html.Div([
            html.H5("Detailed Hotspot Table",
                    style={'color': COLORS['text'],
                           'marginBottom': '12px'}),
            html.Table(
                [table_header] + table_body,
                style={'width':          '100%',
                       'borderCollapse': 'collapse',
                       'color':          COLORS['text'],
                       'fontSize':       '13px'}
            )
        ], style=CARD_STYLE),
    ])


# ════════════════════════════════════════════
# ROUTER CALLBACK
# ════════════════════════════════════════════
@app.callback(
    Output('page-content', 'children'),
    Input('url', 'pathname')
)
def router(pathname):
    if pathname == '/country':    return page_country()
    if pathname == '/forecast':   return page_forecast()
    if pathname == '/simulator':  return page_simulator()
    if pathname == '/hotspot':    return page_hotspot()
    return page_global()


# ════════════════════════════════════════════
# COUNTRY CALLBACK
# ════════════════════════════════════════════
@app.callback(
    Output('country-metrics', 'children'),
    Output('country-charts',  'children'),
    Input('country-select',   'value')
)
def update_country(country):
    cdf = df[
        df['Country/Region'] == country
    ].sort_values('date').copy()

    risk_now = latest[
        latest['Country/Region'] == country
    ]['risk_score']
    risk_now = float(risk_now.values[0]) \
        if len(risk_now) > 0 else 0

    level = risk_label(risk_now)
    level_color = (
        COLORS['danger']   if level == 'High'
        else COLORS['warning'] if level == 'Medium'
        else COLORS['success']
    )

    peak_day = cdf.loc[
        cdf['new_cases'].idxmax(), 'date'
    ].date()

    metrics = dbc.Row([
        dbc.Col(metric_card(
            "TOTAL CASES",
            f"{cdf['confirmed'].max():,.0f}",
            COLORS['accent']
        ), width=3),
        dbc.Col(metric_card(
            "TOTAL DEATHS",
            f"{cdf['deaths'].max():,.0f}",
            COLORS['danger']
        ), width=3),
        dbc.Col(metric_card(
            "PEAK DAY",
            str(peak_day),
            COLORS['warning']
        ), width=3),
        dbc.Col(metric_card(
            "RISK SCORE",
            f"{risk_now:.1f}/100",
            level_color,
            f"{level} Risk"
        ), width=3),
    ], className='mb-3')

    # Charts
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(
        x=cdf['date'], y=cdf['new_cases'],
        name='Daily', opacity=0.4,
        line=dict(color=COLORS['accent'], width=1)
    ))
    fig1.add_trace(go.Scatter(
        x=cdf['date'], y=cdf['rolling_7'],
        name='7d Avg',
        line=dict(color=COLORS['accent'], width=2.5)
    ))
    fig1.update_layout(
        **PLOT_LAYOUT, title='Daily New Cases', height=300
    )

    fig2 = px.line(
        cdf, x='date', y='death_rate',
        title='Case Fatality Rate (%)',
        color_discrete_sequence=[COLORS['danger']]
    )
    fig2.update_layout(**PLOT_LAYOUT, height=300)

    vax = cdf.dropna(subset=['people_vaccinated'])
    vax = vax[vax['people_vaccinated'] > 0]
    if len(vax) > 0:
        fig3 = px.area(
            vax, x='date', y='people_vaccinated',
            title='Vaccination Progress',
            color_discrete_sequence=[COLORS['success']]
        )
    else:
        fig3 = go.Figure()
        fig3.add_annotation(
            text="Vaccination data not available",
            xref="paper", yref="paper",
            x=0.5, y=0.5, showarrow=False,
            font=dict(color=COLORS['muted'])
        )
    fig3.update_layout(**PLOT_LAYOUT, height=300)

    fig4 = px.line(
        cdf, x='date', y='risk_score',
        title='Risk Score Trend',
        color_discrete_sequence=['#a371f7']
    )
    fig4.add_hline(y=33, line_dash='dash',
                   line_color=COLORS['warning'])
    fig4.add_hline(y=66, line_dash='dash',
                   line_color=COLORS['danger'])
    fig4.update_layout(**PLOT_LAYOUT, height=300)

    # Rt chart
    rt_c = rt[rt['Country/Region'] == country]
    fig5 = go.Figure()
    if len(rt_c) > 0:
        fig5.add_trace(go.Scatter(
            x=rt_c['date'], y=rt_c['Rt'],
            name='Rt', fill='tozeroy',
            line=dict(color='#a371f7', width=2),
            fillcolor='rgba(163,113,247,0.1)'
        ))
        fig5.add_hline(
            y=1, line_dash='dash',
            line_color=COLORS['danger'],
            annotation_text='Rt = 1 threshold'
        )
    fig5.update_layout(
        **PLOT_LAYOUT,
        title='Reproduction Number (Rt)',
        height=280,
        yaxis_title='Rt'
    )

    charts = html.Div([
        dbc.Row([
            dbc.Col(
                html.Div([dcc.Graph(figure=fig1)],
                         style=CARD_STYLE), width=6
            ),
            dbc.Col(
                html.Div([dcc.Graph(figure=fig2)],
                         style=CARD_STYLE), width=6
            ),
        ]),
        dbc.Row([
            dbc.Col(
                html.Div([dcc.Graph(figure=fig3)],
                         style=CARD_STYLE), width=6
            ),
            dbc.Col(
                html.Div([dcc.Graph(figure=fig4)],
                         style=CARD_STYLE), width=6
            ),
        ]),
        html.Div([dcc.Graph(figure=fig5)], style=CARD_STYLE),
    ])

    return metrics, charts


# ════════════════════════════════════════════
# SIR CALLBACK
# ════════════════════════════════════════════
@app.callback(
    Output('sir-output', 'children'),
    Input('r-slider',    'value'),
    Input('vax-slider',  'value'),
    Input('days-slider', 'value'),
)
def update_sir(r_value, vax_rate, days):
    population = 1_400_000_000
    infected   = max(1000, int(population * 0.0001))
    S = population * (1 - vax_rate / 100) - infected
    I = float(infected)
    R = population * (vax_rate / 100)
    beta  = r_value / 14
    gamma = 1 / 14
    rows  = []
    for day in range(days):
        ni = beta * S * I / population
        nr = gamma * I
        S  = max(0, S - ni)
        I  = max(0, I + ni - nr)
        R  = R + nr
        rows.append({'Day': day+1, 'S': S, 'I': I, 'R': R})
    sim = pd.DataFrame(rows)

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=sim['Day'], y=sim['S'],
        name='Susceptible',
        line=dict(color=COLORS['accent'], width=2),
        fill='tozeroy',
        fillcolor='rgba(88,166,255,0.08)'
    ))
    fig.add_trace(go.Scatter(
        x=sim['Day'], y=sim['I'],
        name='Infected',
        line=dict(color=COLORS['danger'], width=3)
    ))
    fig.add_trace(go.Scatter(
        x=sim['Day'], y=sim['R'],
        name='Recovered',
        line=dict(color=COLORS['success'], width=2)
    ))
    fig.add_hline(
        y=population * 0.01,
        line_dash='dot', line_color=COLORS['muted'],
        annotation_text='1% population',
        annotation_font_color=COLORS['muted']
    )
    fig.update_layout(
        **PLOT_LAYOUT,
        title=f'SIR Simulation — R={r_value}, '
              f'Vax={vax_rate}%, Days={days}',
        height=450,
        yaxis_title='Population',
        xaxis_title='Day'
    )

    peak_day      = int(sim.loc[sim['I'].idxmax(), 'Day'])
    peak_infected = sim['I'].max()
    total_pct     = sim['R'].iloc[-1] / population * 100
    hit           = (1 - 1/r_value)*100 if r_value > 1 else 0

    if r_value < 1:
        alert = dbc.Alert(
            "✅ R < 1: Epidemic dying out.",
            color='success'
        )
    elif r_value < 1.5:
        alert = dbc.Alert(
            "⚠️ R 1.0–1.5: Slow spread, monitor closely.",
            color='warning'
        )
    else:
        alert = dbc.Alert(
            "🚨 R > 1.5: Rapid spread! Intervention needed.",
            color='danger'
        )

    return html.Div([
        html.Div([dcc.Graph(figure=fig)], style=CARD_STYLE),

        dbc.Row([
            dbc.Col(metric_card(
                "PEAK DAY", f"Day {peak_day}",
                COLORS['warning']
            ), width=3),
            dbc.Col(metric_card(
                "PEAK INFECTED",
                f"{peak_infected:,.0f}",
                COLORS['danger']
            ), width=3),
            dbc.Col(metric_card(
                "TOTAL INFECTED",
                f"{total_pct:.1f}%",
                COLORS['accent']
            ), width=3),
            dbc.Col(metric_card(
                "HERD IMMUNITY THRESHOLD",
                f"{hit:.1f}%" if r_value > 1 else "N/A",
                COLORS['success']
            ), width=3),
        ], className='mb-3'),

        alert
    ])


# ════════════════════════════════════════════
# RUN
# ════════════════════════════════════════════
if __name__ == '__main__':
    app.run(debug=True, port=8050)