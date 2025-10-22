import {
    BuilderProgramKind,
    CancellationToken,
    CompilerHost,
    CompilerOptions,
    createBuilderProgram,
    createRedirectedBuilderProgram,
    CustomTransformers,
    Diagnostic,
    DiagnosticWithLocation,
    EmitResult,
    getBuilderCreationParameters,
    Program,
    ProjectReference,
    ReusableBuilderProgramState,
    SourceFile,
    WriteFileCallback
} from "./_namespaces/ts.js";

export type AffectedFileResult<T> = {
    result: T;

    affected: SourceFile | Program;
} | undefined;

export interface BuilderProgramHost {
    /**
     * se fornecido, este hash seria usado em vez do texto do formato do
     * arquivo real para detectar alterações
     */
    createHash?: (data: string) => string;

    /**
     * quando emit ou emitnextaffectedfile são chamados sem writefile,
     * este retorno de chamada, se presente, seria usado para gravar
     * arquivos
     */
    writeFile?: WriteFileCallback;

    /**
     * armazenar informação sobre a assinatura
     *
     * @internal
     */
    storeSignatureInfo?: boolean;
}

/** @internal */
export type HostForComputeHash = Pick<BuilderProgramHost, "createHash" | "storeSignatureInfo">;

/**
 * builder para gerenciar as mudanças de estado do programa
 */
export interface BuilderProgram {
    /** @internal */
    state: ReusableBuilderProgramState;

    /** @internal */
    hasChangedEmitSignature?(): boolean;

    /**
     * retorna o programa atual
     */
    getProgram(): Program;

    /**
     * retorna o programa atual que pode ser undefined caso
     * o programa tenha sido lançado
     *
     * @internal
     */
    getProgramOrUndefined(): Program | undefined;

    /**
     * lança a referência do programa, fazendo todas as operações
     * que precisem do programa falhar
     *
     * @internal
     */
    releaseProgram(): void;

    /**
     * obtém as opções do compilador do programa
     */
    getCompilerOptions(): CompilerOptions;

    /**
     * obtém o arquivo fonte do programa com o nome do arquivo
     */
    getSourceFile(fileName: string): SourceFile | undefined;

    /**
     * obtém uma lista dos arquivos no programa
     */
    getSourceFiles(): readonly SourceFile[];

    /**
     * obtém os diagnósticos para as opções do compilador
     */
    getOptionsDiagnostics(cancellationToken?: CancellationToken): readonly Diagnostic[];

    /**
     * obtém os diagnósticos que não pertencem a nenhum arquivo
     */
    getGlobalDiagnostics(cancellationToken?: CancellationToken): readonly Diagnostic[];

    /**
     * obtém os diagnósticos da análise do arquivo de configuração
     */
    getConfigFileParsingDiagnostics(): readonly Diagnostic[];

    /**
     * obtém os diagnósticos de sintaxe, para todos os arquivos fonte
     * se o arquivo fonte não foi fornecido
     */
    getSyntacticDiagnostics(sourceFile?: SourceFile, cancellationToken?: CancellationToken): readonly Diagnostic[];

    /**
     * obtém os diagnósticos de declaração, para todos os arquivos fonte
     * se o arquivo fonte não foi fornecido
     */
    getDeclarationDiagnostics(sourceFile?: SourceFile, cancellationToken?: CancellationToken): readonly DiagnosticWithLocation[];

    /**
     * obtém todas as dependências do arquivo
     */
    getAllDependencies(sourceFile: SourceFile): readonly string[];

    /**
     * obtém o diagnóstico semântico do programa correspondente a este
     * estado do arquivo (se fornecido) ou do programa inteiro
     *
     * os diagnósticos semânticos são armazenados em cache e
     * gerenciados aqui
     *
     * notar que presume-se que, quando questionado sobre diagnósticos
     * semânticos por meio desta api, o arquivo foi retirado dos
     * arquivos afetados, portanto, é seguro usar o cache ou obter
     * do programa e armazenar em cache o diagnóstico
     *
     * no caso de semanticdiagnosticsbuilderprogram, se o arquivo
     * fonte não for fornecido, ele iterará por todos os arquivos
     * afetados, para garantir que o cache permaneça válido e ainda
     * fornecer uma maneira de obter todos os diagnósticos semânticos
     */
    getSemanticDiagnostics(sourceFile?: SourceFile, cancellationToken?: CancellationToken): readonly Diagnostic[];

    /**
     * emite os arquivos de declaração e javascript
     *
     * quando o arquivo targetsource é especificado, emite os arquivos
     * correspondentes àquele arquivo de origem, caso contrário,
     * para todo o programa
     *
     * no caso de emitandsemanticdiagnosticsbuilderprogram, quando
     * targetsourcefile é especificado, presume-se que esse arquivo
     * seja manipulado a partir da lista de arquivos afetados
     *
     * se targetsourcefile não for especificado, ele emitirá apenas
     * todos os arquivos afetados em vez do programa inteiro
     *
     * o primeiro dos writefiles, se fornecido, writeFile do
     * builderprogramhost, se fornecido, e writefile do host do
     * compilador, nessa ordem, seriam usados ​​para gravar os
     * arquivos
     */
    emit(targetSourceFile?: SourceFile, writeFile?: WriteFileCallback, cancellationToken?: CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: CustomTransformers): EmitResult;

    /** @internal */
    emitBuildInfo(writeFile?: WriteFileCallback, cancellationToken?: CancellationToken): EmitResult;

    /**
     * obtém o diretório atual do programa
     */
    getCurrentDirectory(): string;

    /** @internal */
    close(): void;
}

/**
 * o builder que armazena os diagnósticos semânticos para o
 * programa e lida as mudanças do arquivo e os arquivos afetados
 */
export interface SemanticDiagnosticsBuilderProgram extends BuilderProgram {
    /**
     * obtém os diagnósticos semânticos do programa para o próximo
     * arquivo afetado e o armazena
     *
     * retorna undefined se a iteração estiver completa
     */
    getSemanticDiagnosticsOfNextAffectedFile(cancellationToken?: CancellationToken, ignoreSourceFile?: (sourceFile: SourceFile) => boolean): AffectedFileResult<readonly Diagnostic[]>;
}

/**
 * o builder que pode manipular as mudanças no programa e iterar
 * através do arquivo alterado para emitir os arquivos
 *
 * os diagnósticos semânticos são armazenados em cache por
 * arquivo e gerenciados pela limpeza dos arquivos
 * alterados/afetados
 */
export interface EmitAndSemanticDiagnosticsBuilderProgram extends SemanticDiagnosticsBuilderProgram {
    /**
     * emite o próximo resultado de emissão do arquivo afetado
     * (emitresult e sourcefiles emitidos) ou retorna
     * undefined se a iteração for concluída
     *
     * o primeiro dos writefiles, se fornecido, writefile do
     * builderprogramhost, se fornecido, e writefile do host do
     * compilador, nessa ordem, seriam usados ​​para gravar os
     * arquivos
     */
    emitNextAffectedFile(writeFile?: WriteFileCallback, cancellationToken?: CancellationToken, emitOnlyDtsFiles?: boolean, customTransformers?: CustomTransformers): AffectedFileResult<EmitResult>;
}

/**
 * cria o builder para gerenciar os diagnósticos semânticos e
 * os armazenar
 */
export function createSemanticDiagnosticsBuilderProgram(
    newProgram: Program,
    host: BuilderProgramHost,

    oldProgram?: SemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[]
): SemanticDiagnosticsBuilderProgram;

export function createSemanticDiagnosticsBuilderProgram(
    rootNames: readonly string[] | undefined,
    options: CompilerOptions | undefined,

    host?: CompilerHost,
    oldProgram?: SemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
): SemanticDiagnosticsBuilderProgram;

export function createSemanticDiagnosticsBuilderProgram(
    newProgramOrRootNames: Program | readonly string[] | undefined,
    hostOrOptions: BuilderProgramHost | CompilerOptions | undefined,

    oldProgramOrHost?: CompilerHost | SemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnosticsOrOldProgram?: readonly Diagnostic[] | SemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
) {
    return createBuilderProgram(
        BuilderProgramKind.SemanticDiagnosticsBuilderProgram,

        getBuilderCreationParameters(
            newProgramOrRootNames,
            hostOrOptions,
            oldProgramOrHost,
            configFileParsingDiagnosticsOrOldProgram,
            configFileParsingDiagnostics,
            projectReferences
        )
    );
}

/**
 * cria o builder que pode manipular as alterações no programa e
 * iterar pelos arquivos alterados para emitir esses arquivos
 * e gerenciar o cache de diagnóstico semântico também
 */
export function createEmitAndSemanticDiagnosticsBuilderProgram(
    newProgram: Program,
    host: BuilderProgramHost,

    oldProgram?: EmitAndSemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[]
): EmitAndSemanticDiagnosticsBuilderProgram;

export function createEmitAndSemanticDiagnosticsBuilderProgram(
    rootNames: readonly string[] | undefined,
    options: CompilerOptions | undefined,

    host?: CompilerHost,
    oldProgram?: EmitAndSemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
): EmitAndSemanticDiagnosticsBuilderProgram;

export function createEmitAndSemanticDiagnosticsBuilderProgram(
    newProgramOrRootNames: Program | readonly string[] | undefined,
    hostOrOptions: BuilderProgramHost | CompilerOptions | undefined,

    oldProgramOrHost?: CompilerHost | EmitAndSemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnosticsOrOldProgram?: readonly Diagnostic[] | EmitAndSemanticDiagnosticsBuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
) {
    return createBuilderProgram(
        BuilderProgramKind.EmitAndSemanticDiagnosticsBuilderProgram,

        getBuilderCreationParameters(
            newProgramOrRootNames,
            hostOrOptions,
            oldProgramOrHost,
            configFileParsingDiagnosticsOrOldProgram,
            configFileParsingDiagnostics,
            projectReferences
        )
    );
}

/**
 * cria um builder que é apenas uma abstração sobre o
 * programa e pode ser usado com watch
 */
export function createAbstractBuilder(
    newProgram: Program,
    host: BuilderProgramHost,

    oldProgram?: BuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[]
): BuilderProgram;

export function createAbstractBuilder(
    rootNames: readonly string[] | undefined,
    options: CompilerOptions | undefined,

    host?: CompilerHost,
    oldProgram?: BuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
): BuilderProgram;

export function createAbstractBuilder(
    newProgramOrRootNames: Program | readonly string[] | undefined,
    hostOrOptions: BuilderProgramHost | CompilerOptions | undefined,

    oldProgramOrHost?: CompilerHost | BuilderProgram,
    configFileParsingDiagnosticsOrOldProgram?: readonly Diagnostic[] | BuilderProgram,
    configFileParsingDiagnostics?: readonly Diagnostic[],
    projectReferences?: readonly ProjectReference[]
): BuilderProgram {
    const { newProgram, configFileParsingDiagnostics: newConfigFileParsingDiagnostics } = getBuilderCreationParameters(
        newProgramOrRootNames,
        hostOrOptions,
        oldProgramOrHost,
        configFileParsingDiagnosticsOrOldProgram,
        configFileParsingDiagnostics,
        projectReferences
    );

    return createRedirectedBuilderProgram(
        {
            program: newProgram,

            compilerOptions: newProgram.getCompilerOptions()
        }, newConfigFileParsingDiagnostics
    );
}