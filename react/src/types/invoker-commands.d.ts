import 'react';

// The Invoker Commands API (`command` / `commandfor`) and the `<dialog closedby>`
// attribute are part of the HTML platform but not yet in React's JSX types.
// Augment them here so the native-dialog markup typechecks.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ButtonHTMLAttributes<T> {
    command?: string;
    commandfor?: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface DialogHTMLAttributes<T> {
    closedby?: 'any' | 'closerequest' | 'none';
  }
}
