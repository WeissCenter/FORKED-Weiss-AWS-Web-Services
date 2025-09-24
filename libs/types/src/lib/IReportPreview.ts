import { DataView } from "./DataView";
import { IRenderedTemplate } from "./ITemplate";
import { ReportVisibility } from "./ReportVisibility";
import { DataSet } from "./backend/DataSet";

export interface IReportPreview {
  dataView: DataView;
  template: string;
  audience: string;
  title: string;
  description: string;
}
