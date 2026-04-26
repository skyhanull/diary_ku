"use client";
// 에러 바운더리: 하위 컴포넌트에서 예외가 발생하면 잡아서 앱 전체 크래시를 막는다
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-ds-4 text-ds-body text-cedar/60">
          오류가 발생했어요. 페이지를 새로고침해보세요.
        </div>
      );
    }
    return this.props.children;
  }
}
