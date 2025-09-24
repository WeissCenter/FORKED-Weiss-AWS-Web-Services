import { SQLJoinType } from "../SQLJoinType";
import { DataSetDataSource, DataSetDataSourceRelationship } from "./DataSet";

export interface NewDataSetInput {
  name: string;
  dataSetID?: string;
  description: string;
  summaryTemplate?: string;
  dataSources: DataSetDataSource[];
  dataSourceRelationships: DataSetDataSourceRelationship[];
}
