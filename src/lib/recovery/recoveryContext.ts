// We hold a global lock and recovery promise so that multiple failed requests
// queue up behind a single recovery attempt rather than all trying to recover at once.
let globalRecoveryPromise: Promise<boolean> | null = null;
let isRecovering = false;

export const setRecoveryPromise = (promise: Promise<boolean> | null) => {
    globalRecoveryPromise = promise;
};

export const getRecoveryPromise = () => {
    return globalRecoveryPromise;
};

export const setRecoveringState = (state: boolean) => {
    isRecovering = state;
};

export const getRecoveringState = () => {
    return isRecovering;
};
