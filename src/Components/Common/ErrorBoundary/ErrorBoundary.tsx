import React from 'react';

/**
 * Arguments exposed to fallback render functions.
 */
type ErrorBoundaryFallbackProps = {
  resetErrorBoundary: () => void;
};

/**
 * Props for the ErrorBoundary component.
 */
type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback:
    | React.ReactNode
    | ((props: ErrorBoundaryFallbackProps) => React.ReactNode);
  resetKeys?: readonly unknown[];
  onReset?: () => void;
};

/**
 * Internal error state for the boundary.
 */
type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Guard UI against render-time errors and show a fallback.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  /**
   * Update state to render the fallback UI on error.
   */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /**
   * Reset the boundary when callers retry explicitly or when reset keys change.
   */
  componentDidUpdate(previousProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      didResetKeysChange(previousProps.resetKeys, this.props.resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Clear the error state and notify callers that recovery was requested.
   */
  resetErrorBoundary = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false });
  };

  /**
   * Render the fallback UI when an error has been caught, otherwise render children.
   */
  render(): React.ReactNode {
    if (this.state.hasError) {
      return typeof this.props.fallback === 'function'
        ? this.props.fallback({
            resetErrorBoundary: this.resetErrorBoundary,
          })
        : this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Compare reset keys shallowly to decide whether the boundary should recover.
 */
const didResetKeysChange = (
  previousKeys?: readonly unknown[],
  nextKeys?: readonly unknown[]
): boolean => {
  if (!previousKeys || !nextKeys) {
    return false;
  }
  if (previousKeys.length !== nextKeys.length) {
    return true;
  }
  return previousKeys.some((key, index) => !Object.is(key, nextKeys[index]));
};
