import { ISuppression } from "../ITemplate";

export interface GetDataFromDataViewInput {
  fileSpec?: string;
  operations: DataViewOperation[];
  suppression?: ISuppression;
}

export interface DataViewOperation {
  metadata?: Record<string, any>;
  id: string;
  function: string;
  arguments: DataViewOperationArgument[];
}

export interface DataViewOperationArgument {
  field: string;
  type?: "string" | "number";
  array?: boolean;
  operator?: "OR" | "AND" | "NOT";
  value?: any;
}
