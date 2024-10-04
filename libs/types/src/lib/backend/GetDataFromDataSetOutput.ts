export interface GetDataFromDataSetOutput {
  dataSourceID?: string;
  dataSetID?: string;
  suppressedResults?: any;
  operationResults: DataSetOperationResult[];
}

export interface DataSetOperationResult {
  id: string;
  value: any;
}
