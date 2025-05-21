declare const acquireVsCodeApi: Function;

interface VSCodeApi {
  getState: () => any;
  setState: (newState: any) => any;
  postMessage: (message: any) => void;
}

class VSCodeWrapper {
  private readonly vscodeApi: VSCodeApi = acquireVsCodeApi();

  public postMessage(message: any): void {
    this.vscodeApi.postMessage(message);
  }

  public onMessage(callback: (message: any) => void): () => void {
    window.addEventListener('message', callback);
    return () => window.removeEventListener('message', callback);
  }

  public getState = (): any => {
    return this.vscodeApi.getState() ?? {};
  };

  public setState = (newState: any): any => {
    return this.vscodeApi.setState(newState);
  };
}

const VSCodeAPI = new VSCodeWrapper();
export default VSCodeAPI; 