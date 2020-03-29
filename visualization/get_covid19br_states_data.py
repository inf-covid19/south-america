
from datetime import datetime, timedelta
import urllib.request
import pandas as pd
import argparse
import warnings
warnings.simplefilter('ignore')

COVID19_STATES_URL = 'https://cdn.jsdelivr.net/gh/wcota/covid19br@master/cases-brazil-states.csv'

DATE_FORMAT = "%Y-%m-%d"
CSV_DTYPE = {
    'ibgeID': str,
    'totalCases': int,
    'newCases': int,
}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-o", "--output", help="output csv file", default="covid19-states.csv")
    args = parser.parse_args()

    print('Retrieving covid19br states data...')

    states_df = pd.read_csv(COVID19_STATES_URL, dtype=CSV_DTYPE)

    print('Filling missing states data...')

    states = states_df['state'].unique()

    for state in states:
        state_df = states_df[states_df['state'] == state]

        min_date = datetime.strptime(state_df['date'].min(), DATE_FORMAT)
        max_date = datetime.strptime(state_df['date'].max(), DATE_FORMAT)

        delta_date = max_date - min_date

        if len(state_df) == delta_date.days + 1:
            continue

        last_day_df = state_df[state_df['date'] ==
                               datetime.strftime(min_date, DATE_FORMAT)]
        for i in range(delta_date.days + 1):
            day = min_date + timedelta(days=i)
            day_df = state_df[state_df['date'] ==
                              datetime.strftime(day, DATE_FORMAT)]

            if day_df.empty:
                last_day_df['date'] = datetime.strftime(day, DATE_FORMAT)
                last_day_df['newCases'] = 0

                state_df = pd.concat(
                    [state_df, last_day_df], ignore_index=True)
            else:
                last_day_df = day_df

        states_df = pd.concat([states_df, state_df]
                              ).drop_duplicates().reset_index(drop=True)

    states_df.sort_values('date', inplace=True)
    states_df['totalCases'] = states_df['totalCases'].astype(int)

    states_df.to_csv(args.output, index=False)

    print("Saved result in", args.output)
