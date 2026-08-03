export type CodeState = 0 | 1 | 2 | 3;

export type DockerTemplate = {
  containerName: string;
  image: string;
  ports: string[];
  extraVolumes: string[];
  memory: number;
  memorySwap: number;
  networkMode: string;
  networkAliases: string[];
  cpusetCpus: string;
  cpuUsage: number;
  maxSpace: number;
  io: number;
  network: number;
  workingDir: string;
  changeWorkdir: boolean;
  env: string[];
  hostname: string;
  extraArgs: string[];
};

export type SKUInput = {
  alias: string;
  nickname: string;
  startCommand: string;
  stopCommand: string;
  cwd: string;
  ie: string;
  oe: string;
  createDatetime: number;
  lastDatetime: number;
  type: string;
  tag: string[];
  endTime: number;
  fileCode: string;
  processType: string;
  updateCommand: string;
  actionCommandList: string[];
  crlf: number;
  docker: DockerTemplate;
  pingConfig: { ip: string; port: number; type: number };
  terminalOption: { haveColor: boolean; pty: boolean };
  eventTask: { autoStart: boolean; autoRestart: boolean; ignore: boolean };
};

export type SKU = SKUInput & {
  id: number;
  createdAt: number;
};

export type CodeRecord = {
  code: string;
  skuId: number;
  skuAlias: string;
  days: number;
  status: CodeState;
  username?: string;
  createdAt: number;
  usedAt: number | null;
};

export type CodeList = {
  items: CodeRecord[];
  total: number;
  limit: number;
  offset: number;
};

export type CodeStatus = CodeRecord & {
  username: string;
  password: string;
  ipAddress: string;
};

export type ImportResult = {
  added: number;
  duplicates: number;
  failed: number;
  duplicateCodes: string[];
  failedCodes: string[];
};

export type AdminRequest = <T = unknown>(
  path: string,
  options?: RequestInit,
) => Promise<T>;

export type Notify = (
  level: "success" | "error",
  title: string,
  options?: { description?: string; id?: string },
) => void;

export const codeStateLabels: Record<CodeState, string> = {
  0: "未使用",
  1: "已使用",
  2: "已禁用",
  3: "已锁定",
};

export const defaultSKU: SKUInput = {
  alias: "",
  nickname: "",
  startCommand: "",
  stopCommand: "stop",
  cwd: ".",
  ie: "utf-8",
  oe: "utf-8",
  createDatetime: 0,
  lastDatetime: 0,
  type: "universal",
  tag: [],
  endTime: 0,
  fileCode: "utf-8",
  processType: "docker",
  updateCommand: "",
  actionCommandList: [],
  crlf: 1,
  docker: {
    containerName: "",
    image: "",
    ports: [],
    extraVolumes: [],
    memory: 256,
    memorySwap: 256,
    networkMode: "bridge",
    networkAliases: [],
    cpusetCpus: "",
    cpuUsage: 200,
    maxSpace: 1,
    io: 0,
    network: 0,
    workingDir: "/workspace",
    changeWorkdir: true,
    env: [],
    hostname: "",
    extraArgs: [],
  },
  pingConfig: { ip: "", port: 0, type: 1 },
  terminalOption: { haveColor: true, pty: true },
  eventTask: { autoStart: false, autoRestart: true, ignore: false },
};
