from dar_tool import DataAnonymizer
import pandas as pd
import json

def handler(event, context):
    
    print("EVENT", event)

    frequency_columns = event.get('frequencyColumns')
    sensitive_columns = event.get('sensitiveColumns')

    if type(frequency_columns) != list:
        frequency_columns = [frequency_columns]

    if type(sensitive_columns) != list:
        sensitive_columns = [sensitive_columns]

    threshold = event.get('threshold', 30)

    data = event.get('data')

    for operation in data:
        id = operation.get('id')

        value = operation.get('value', [])


        # skip non list or if list is empty for the time being
        if type(value) != list or len(value) <= 0:
            continue

        operation_sensitive_columns = list(filter(lambda x: x in sensitive_columns, value[0].keys()))



        print("operation_sensitive_columns", list(operation_sensitive_columns))

        df_anonymized = pd.DataFrame.from_dict(value)


        for frequency_column in frequency_columns:
            anonymizer = DataAnonymizer(df_anonymized, sensitive_columns=operation_sensitive_columns, frequency=frequency_column, minimum_threshold=threshold)

            df_anonymized = anonymizer.apply_anonymization()

        anonymized = []

        for index, row in df_anonymized.iterrows():
            
            mapped_obj = value[index]

            for frequency_column in frequency_columns:
                if row['RedactBinary'] == 1:
                    mapped_obj[frequency_column] = 0
                else:
                    mapped_obj[frequency_column] = row[frequency_column]

            anonymized.append(mapped_obj)


        operation['value'] = anonymized

        # Need to map the anonymized rows back to the input data



    return data