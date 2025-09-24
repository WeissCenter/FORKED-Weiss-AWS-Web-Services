import { DBDataViewDataCollection } from "./backend/NewDataViewInput";

export interface DataView {
  dataViewID: string;
  author: string;
  name: string;
  valid?: boolean;
  created: number;
  updated?: number;
  status: string;
  description: string;
  dataViewType: "collection" | "file" | "database";
  data: DBDataViewDataCollection;
  lastPull: "";
  pulledBy: "";
}

export interface DBDataView {
  dataViewID: string;
  author: string;
  name: string;
  valid?: boolean;
  created: number;
  status: string;
  updated?: number;
  description: string;
  id: string;
  dataViewType: "collection" | "file" | "database";
  type: string;
  data: DBDataViewDataCollection;
  lastPull: "";
  pulledBy: "";
}
