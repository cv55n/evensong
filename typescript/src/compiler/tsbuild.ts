import {
    combinePaths,
    Extension,
    fileExtensionIs,
    Path,
    ResolvedConfigFileName
} from "./_namespaces/ts.js";

/** @internal */
export enum UpToDateStatusType {
    Unbuildable,
    UpToDate,

    /**
     * o projeto parece desatualizado porque seus inputs de upstream
     * são mais recentes que seus outputs, mas todos os seus outputs
     * são, na verdade, mais recentes que os outputs idênticos
     * anteriores de seus inputs (.d.ts)
     *
     * isso significa que podemos fazer uma pseudoconstrução
     * (apenas tocar nos registros de data e hora), como se
     * realmente tivéssemos construído este projeto
     */
    UpToDateWithUpstreamTypes,

    OutputMissing,
    ErrorReadingFile,

    OutOfDateWithSelf,
    OutOfDateWithUpstream,
    OutOfDateBuildInfoWithPendingEmit,
    OutOfDateBuildInfoWithErrors,
    OutOfDateOptions,
    OutOfDateRoots,

    UpstreamOutOfDate,
    UpstreamBlocked,

    ComputingUpstream,
    TsVersionOutputOfDate,
    UpToDateWithInputFileText,

    /**
     * projetos sem output (ex: arquivos de solução)
     */
    ContainerOnly,
    ForceBuild
}

/** @internal */
export type UpToDateStatus =
    | Status.Unbuildable
    | Status.UpToDate
    | Status.OutputMissing
    | Status.ErrorReadingFile
    | Status.OutOfDateWithSelf
    | Status.OutOfDateWithUpstream
    | Status.OutOfDateBuildInfo
    | Status.OutOfDateRoots
    | Status.UpstreamOutOfDate
    | Status.UpstreamBlocked
    | Status.ComputingUpstream
    | Status.TsVersionOutOfDate
    | Status.ContainerOnly
    | Status.ForceBuild;

/** @internal */
export namespace Status {
    /**
     * esse projeto não pode ser construído em seu estado atual. por
     * exemplo, seu arquivo de configuração não pode ser analisado,
     * ou possui um erro de sintaxe ou algum arquivo ausente
     */
    export interface Unbuildable {
        type: UpToDateStatusType.Unbuildable;

        reason: string;
    }

    /**
     * esse projeto não tem nenhum output, então "ele está atualizado"
     * é uma pergunta sem sentido
     */
    export interface ContainerOnly {
        type: UpToDateStatusType.ContainerOnly;
    }

    /**
     * o projeto está atualizado em respeito a seus inputs. rastrear
     * então qual é o arquivo input mais recente
     */
    export interface UpToDate {
        type:
            | UpToDateStatusType.UpToDate
            | UpToDateStatusType.UpToDateWithUpstreamTypes
            | UpToDateStatusType.UpToDateWithInputFileText;

        newestInputFileTime?: Date;
        newestInputFileName?: string;
        oldestOutputFileName: string;
    }

    /**
     * um ou mais outputs do projeto não existem
     */
    export interface OutputMissing {
        type: UpToDateStatusType.OutputMissing;

        /**
         * o nome do primeiro arquivo de output que não existia
         */
        missingOutputFileName: string;
    }

    /** erro ao ler o arquivo */
    export interface ErrorReadingFile {
        type: UpToDateStatusType.ErrorReadingFile;
        fileName: string;
    }

    /**
     * um ou mais outputs do projeto são mais antigos que seu
     * input mais recente
     */
    export interface OutOfDateWithSelf {
        type: UpToDateStatusType.OutOfDateWithSelf;
        outOfDateOutputFileName: string;
        newerInputFileName: string;
    }

    /**
     * buildinfo indica que a compilação está desatualizada
     */
    export interface OutOfDateBuildInfo {
        type:
            | UpToDateStatusType.OutOfDateBuildInfoWithPendingEmit
            | UpToDateStatusType.OutOfDateBuildInfoWithErrors
            | UpToDateStatusType.OutOfDateOptions;

        buildInfoFile: string;
    }

    export interface OutOfDateRoots {
        type: UpToDateStatusType.OutOfDateRoots;
        buildInfoFile: string;
        inputFile: Path;
    }

    /**
     * esse projeto depende de um projeto desatualizado, então
     * ainda não deve ser construído
     */
    export interface UpstreamOutOfDate {
        type: UpToDateStatusType.UpstreamOutOfDate;
        upstreamProjectName: string;
    }

    /**
     * esse projeto depende de um projeto upstream com erros
     * de construção
     */
    export interface UpstreamBlocked {
        type: UpToDateStatusType.UpstreamBlocked;

        upstreamProjectName: string;
        upstreamProjectBlocked: boolean;
    }

    /**
     * status de computação dos projetos upstream referenciados
     */
    export interface ComputingUpstream {
        type: UpToDateStatusType.ComputingUpstream;
    }

    export interface TsVersionOutOfDate {
        type: UpToDateStatusType.TsVersionOutputOfDate;
        version: string;
    }

    /**
     * um ou mais outputs do projeto são mais antigos que o
     * output mais recente de um projeto upstream
     */
    export interface OutOfDateWithUpstream {
        type: UpToDateStatusType.OutOfDateWithUpstream;
        outOfDateOutputFileName: string;
        newerProjectName: string;
    }

    export interface ForceBuild {
        type: UpToDateStatusType.ForceBuild;
    }
}

/** @internal */
export function resolveConfigFileProjectName(project: string): ResolvedConfigFileName {
    if (fileExtensionIs(project, Extension.Json)) {
        return project as ResolvedConfigFileName;
    }

    return combinePaths(project, "tsconfig.json") as ResolvedConfigFileName;
}