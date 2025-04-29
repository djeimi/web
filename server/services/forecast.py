import pandas as pd
from prophet import Prophet
import matplotlib.pyplot as plt
import json
import sys
import time
from matplotlib import rcParams
from io import BytesIO
import base64

rcParams['figure.figsize'] = (12, 6)
rcParams['lines.linewidth'] = 2
rcParams['axes.grid'] = True

def generate_plot(forecast, df, username):
    fig = model.plot(forecast)
    ax = fig.gca()
    
    forecast_start = forecast['ds'].max() - pd.Timedelta(days=30)
    forecast_part = forecast[forecast['ds'] > forecast_start]
    
    ax.axhline(y=90, color='r', linestyle='--', label='Цель 90%')
    
    ax.plot(forecast_part['ds'], forecast_part['yhat'], 
            'g--', label='Прогноз')
    
    ax.fill_between(forecast_part['ds'], 
                   forecast_part['yhat_lower'], 
                   forecast_part['yhat_upper'], 
                   color='gray', alpha=0.2, label='Доверительный интервал')
    
    ax.legend()
    ax.set_title(f'Прогноз успеваемости для пользователя {username}')
    ax.set_xlabel('Дата')
    ax.set_ylabel('Процент правильных ответов')

    image = BytesIO()
    plt.tight_layout()
    plt.savefig(image, format='jpg')
    image.seek(0)
    my_base64_jpgData = base64.b64encode(image.read()).decode()
    
    return my_base64_jpgData

if __name__ == "__main__":
    df = pd.read_csv('temp_data.csv')
    username = df['username'].iloc[0] if 'username' in df.columns and not df['username'].isnull().iloc[0] else 'unknown'
    
    df = df.rename(columns={'answer_date': 'ds', 'percent_correct': 'y'})
    
    model = Prophet(
        seasonality_mode='multiplicative',
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=True
    )

    model.fit(df)
    
    future = model.make_future_dataframe(periods=60)
    forecast = model.predict(future)
    
    plot_path = generate_plot(forecast, df, username)
    
    over_90 = forecast[forecast['yhat'] > 90]
    if len(over_90) > 0:
        first_over_90 = over_90.iloc[0]['ds'].strftime('%Y-%m-%d')
        current_rate = df['y'].iloc[-1]
        days_to_90 = (pd.to_datetime(first_over_90) - pd.to_datetime(df['ds'].iloc[-1])).days
    else:
        first_over_90 = None
        days_to_90 = None
        current_rate = df['y'].iloc[-1]
        
    result = {
        "current_rate": float(current_rate),
        "forecast_date": first_over_90,
        "days_to_90": days_to_90,
        "is_achievable": days_to_90 is not None,
        "img": plot_path
    }
    
    print(json.dumps(result))