export interface GetDataFromDataViewOutput {
  dataViewID?: string;
  suppressedResults?: any;
  operationResults: DataViewOperationResult[];
}

export interface DataViewOperationResult {
  id: string;
  value: any;
}
