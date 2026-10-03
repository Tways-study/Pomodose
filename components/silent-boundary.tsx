"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * Swaps in `fallback` if the children throw while rendering. Used around a Convex
 * query that is nice to have (e.g. the email in the profile bubble), so that a
 * backend function that is missing or failing degrades that one control instead of
 * taking the page down.
 */
export class SilentBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Pomodose: a non-critical component failed and was replaced", error, info.componentStack);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
