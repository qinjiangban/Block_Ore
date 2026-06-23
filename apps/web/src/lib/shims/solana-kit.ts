type DecoderResult = {
  messageBytes?: Uint8Array;
  signatures?: Record<string, Uint8Array>;
};

const noopBytes = () => new Uint8Array();
const noopDecode = () =>
  ({ messageBytes: noopBytes(), signatures: {} }) satisfies DecoderResult;
const passthroughSecondArg = (...args: unknown[]) => args[1];

export const getBase58Decoder = () => ({
  decode: () => noopBytes(),
});

export const getBase58Encoder = () => ({
  encode: () => noopBytes(),
});

export const getBase64Decoder = () => ({
  decode: () => noopBytes(),
});

export const getTransactionDecoder = () => ({
  decode: () => noopDecode(),
});

export const getCompiledTransactionMessageDecoder = () => ({
  decode: () => ({}),
});

export const getTransactionEncoder = () => ({
  encode: () => noopBytes(),
});

export const address = (value: string) => value;
export const blockhash = (value: string) => value;
export const createSolanaRpc = () => ({});
export const createSolanaRpcSubscriptions = () => ({});
export const createTransactionMessage = () => ({});
export const compileTransaction = (value: unknown) => value;
export const decompileTransactionMessage = (value: unknown) => value;
export const fetchAddressesForLookupTables = async () => [];

export const pipe = <T>(value: T, ...transformers: Array<(current: T) => T>) =>
  transformers.reduce((current, transformer) => transformer(current), value);

export const setTransactionMessageFeePayerSigner = (...args: unknown[]) =>
  passthroughSecondArg(...args);

export const setTransactionMessageLifetimeUsingBlockhash = (
  ...args: unknown[]
) => passthroughSecondArg(...args);

export const appendTransactionMessageInstructions = (...args: unknown[]) =>
  passthroughSecondArg(...args);

export const appendTransactionMessageInstruction = (...args: unknown[]) =>
  passthroughSecondArg(...args);

export const setTransactionMessageFeePayer = (...args: unknown[]) =>
  passthroughSecondArg(...args);
