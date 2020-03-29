
from datetime import datetime, timedelta
import urllib.request
import pandas as pd
import argparse
import warnings
warnings.simplefilter('ignore')


COVID19_CITIES_TIME_URL = 'https://cdn.jsdelivr.net/gh/wcota/covid19br@master/cases-brazil-cities-time.csv'
COVID19_CITIES_TODAY_URL = 'https://cdn.jsdelivr.net/gh/wcota/covid19br@master/cases-brazil-cities.csv'

DATE_FORMAT = "%Y-%m-%d"
CUSTOM_CITIES_NAME = [
    'ESTRANGEIRO/',
    'FORA DO ESTADO/',
    'NÃO ESPECIFICADA/',
    'NO-INFO/',
]
CSV_DTYPE = {
    'ibgeID': str,
    'totalCases': int,
    'newCases': int,
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-o", "--output", help="output csv file", default="covid19-cities.csv")
    args = parser.parse_args()

    print('Retrieving covid19br cities data...')

    time_df = pd.read_csv(COVID19_CITIES_TIME_URL, dtype=CSV_DTYPE)
    today_df = pd.read_csv(COVID19_CITIES_TODAY_URL, dtype=CSV_DTYPE)

    last_date = datetime.strptime(time_df['date'].max(), DATE_FORMAT)

    new_date = last_date + timedelta(days=1)

    today_df['date'] = [new_date.strftime(DATE_FORMAT)] * len(today_df)
    today_df['newCases'] = None

    cities = today_df['city'].unique()

    print('Adding updated data to history dataframe...')

    for city in cities:
        last_total = time_df[(time_df['city'] == city) &
                             (time_df['date'] == last_date.strftime(DATE_FORMAT))]['totalCases']
        today_total = today_df[today_df['city'] == city]['totalCases']

        new_total = 0
        if not last_total.empty:
            new_total = int(today_total) - int(last_total)

        today_df.loc[today_df['city'] == city, 'newCases'] = new_total

    history_df = pd.concat([time_df, today_df])

    print('Cleaning history data...')

    history_df.drop(history_df[history_df['state']
                               == 'TOTAL'].index, inplace=True)

    for index, custom_name in enumerate(CUSTOM_CITIES_NAME):
        custom_df = history_df[history_df['city'].str.contains(custom_name)]
        custom_df['ibgeID'] = custom_df['ibgeID'].astype(str) + str(index)

        history_df.update(custom_df)

    print('Filling missing cities data...')

    ibgeIDs = history_df['ibgeID'].unique()

    for ibgeID in ibgeIDs:
        city_df = history_df[history_df['ibgeID'] == ibgeID]

        min_date = datetime.strptime(city_df['date'].min(), DATE_FORMAT)
        max_date = datetime.strptime(city_df['date'].max(), DATE_FORMAT)

        delta_date = max_date - min_date

        if len(city_df) == delta_date.days + 1:
            continue

        last_day_df = city_df[city_df['date'] ==
                              datetime.strftime(min_date, DATE_FORMAT)]
        for i in range(delta_date.days + 1):
            day = min_date + timedelta(days=i)
            day_df = city_df[city_df['date'] ==
                             datetime.strftime(day, DATE_FORMAT)]

            if day_df.empty:
                last_day_df['date'] = datetime.strftime(day, DATE_FORMAT)
                last_day_df['newCases'] = 0

                city_df = pd.concat([city_df, last_day_df], ignore_index=True)
            else:
                last_day_df = day_df

        history_df = pd.concat([history_df, city_df]
                               ).drop_duplicates().reset_index(drop=True)

    history_df.sort_values('date', inplace=True)
    history_df['totalCases'] = history_df['totalCases'].astype(int)

    history_df.to_csv(args.output, index=False)

    print("Saved result in", args.output)
