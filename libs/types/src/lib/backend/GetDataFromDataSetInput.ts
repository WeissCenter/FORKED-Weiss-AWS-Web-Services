import { ISuppression } from "../ITemplate";

export interface GetDataFromDataSetInput {
  operations: DataSetOperation[];
  suppression: ISuppression;
}

export interface DataSetOperation {
  id: string;
  function: string;
  arguments: DataSetOperationArgument[];
}

export interface DataSetOperationArgument {
  field: string;
  type?: "string" | "number";
  array?: boolean;
  operator?: "OR" | "AND" | "NOT";
  value?: any;
}
