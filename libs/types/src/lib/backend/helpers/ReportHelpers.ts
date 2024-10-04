import { DynamoDBDocument, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DataSetQueueStatus } from '../DataSetQueueStatus';
import { IReport } from '../../IReport';
import { createUpdateItemFromObject } from '../../util';
import { ReportVersion } from '../ReportVersion';
import { QueryInput } from '@aws-sdk/client-dynamodb';

export async function getReportFromDynamo(
  db: any,
  TABLE_NAME: string,
  id: string,
  version: ReportVersion = ReportVersion.DRAFT
) {
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      type: 'Report',
      id: `ID#${id}${version ? '#Version#' + version : ''}`,
    },
  };

  const result = await db.get(getParams);

  return result?.Item as IReport;
}

export async function getReportVersionsFromDynamo(db: any, TABLE_NAME: string, id: string) {
  const queryParams = {
    TableName: TABLE_NAME,
    KeyConditionExpression: '#type = :type AND  begins_with(#id, :id)',
    FilterExpression: '#version IN (:draft, :finalized)',
    ExpressionAttributeNames: {
      '#type': 'type',
      '#id': 'id',
      '#version': 'version',
    },
    ExpressionAttributeValues: {
      ':type': 'Report',
      ':id': `ID#${id}#Version`,
      ':draft': 'draft',
      ':finalized': 'finalized',
    },
  };

  const result = await db.query(queryParams);

  return result?.Items || [];
}

export function updateReportVersion(
  db: any,
  TABLE_NAME: string,
  report: IReport,
  version: ReportVersion = ReportVersion.DRAFT
) {
  const updateObject = createUpdateItemFromObject({ ...report, version: version, updated: `${Date.now()}` }, [
    'id',
    'type',
  ]);

  const updateParams = {
    TableName: TABLE_NAME,
    Key: {
      type: 'Report',
      id: `ID#${report.reportID}#Version#${version}`,
    },
    ...updateObject,
  };

  return db.update(updateParams);
}
