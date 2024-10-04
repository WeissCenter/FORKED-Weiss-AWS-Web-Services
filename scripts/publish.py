from dar_tool import DataAnonymizer
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from awsglue.dynamicframe import DynamicFrame
import boto3
from boto3.dynamodb.types import TypeDeserializer
from sql_metadata import Parser
import uuid
import json
import traceback
import sys
from pyspark.sql import functions as F
from pyspark.sql.functions import lit, isnan, col, count
from pyspark.sql.window import Window
import pyspark
from itertools import combinations

def clearS3(bucket, prefix):
    s3 = boto3.resource('s3')
    bucket = s3.Bucket(bucket)
    bucket.objects.filter(Prefix=prefix).delete()

args = getResolvedOptions(sys.argv, ["JOB_NAME", "report-id", "glue-database", "table-name", "data-pull-s3", "report-data-s3", "published-report-data-crawler", "user"])
sc = SparkContext()
sc.setLogLevel('DEBUG')
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args["JOB_NAME"], args)
dbClient = boto3.client('dynamodb')
logger = glueContext.get_logger()

deserializer = TypeDeserializer()


try:
    report = args["report_id"]
    table_name = args["table_name"]
    data_pull_s3 = args["data_pull_s3"]
    report_data_s3 = args["report_data_s3"]
    glue_database = args["glue_database"]
    published_report_data_crawler = args["published_report_data_crawler"]

    dynamoResponse = dbClient.get_item(TableName=table_name, Key={"type": {"S": "Report"}, "id": {"S": f"ID#{report}#Version#draft"}})

    dynamo_report = {k: deserializer.deserialize(v) for k, v in dynamoResponse["Item"].items()} 

    new_node = glueContext.create_dynamic_frame.from_catalog(database=glue_database, table_name=dynamo_report['dataView'].replace("-", "_"))   


        #     format_options={"compression": "snappy"},
        # connection_type="s3",
        # format='parquet',
        # connection_options={
        #     "paths": [
        #         f"s3://{data_pull_s3}/{dynamo_report['dataView']}/"
        #     ]
        # },


    data_frame = new_node.toDF().toPandas().fillna('')


    if 'suppression' in dynamo_report['template'] and dynamo_report['template']['suppression'].get('required', False):
        suppression =  dynamo_report['template']['suppression']
        frequency_columns = suppression.get('frequencyColumns', [])
        sensitive_columns = suppression.get('sensitiveColumns', [])

        for frequency in frequency_columns:
            anonymizer = DataAnonymizer(data_frame, sensitive_columns=list(sensitive_columns), redact_value=0, frequency=frequency, minimum_threshold=30)

            data_frame = anonymizer.apply_anonymization()
        

    clearS3(report_data_s3, report)

    glueContext.write_dynamic_frame.from_options(
        frame=DynamicFrame.fromDF(spark.createDataFrame(data_frame), glueContext, str(uuid.uuid4())),
        connection_type="s3",
        format="glueparquet",
        connection_options={
            "path": f"s3://{report_data_s3}/{report}",
            "partitionKeys": [],
        },
        format_options={"compression": "snappy"},)


    glue_client = boto3.client('glue')
    glue_client.start_crawler(Name=published_report_data_crawler)



except Exception as e:
    logger.error(f"ERROR: {e}")
    logger.error(f"TRACEBACK: {traceback.format_exc()}")
    raise Exception(json.dumps({"user": args["user"], "err": traceback.format_exc()}))