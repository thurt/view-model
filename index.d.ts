export = ViewModel;

declare function ViewModel(shouldLogEvents: boolean): ViewModel.Interface;

declare namespace ViewModel {
  export interface Interface {
    create(
      key: string,
      extend_members: {[method_name: string]: (...args: Array<any>) => any},
    ): boolean;
    run(
      key: string,
      funcToRun: (...args: Array<any>) => any,
      ...args: Array<any>
    ): boolean;
    exists(key: string): boolean;
    destroy(key: string): boolean;
    add(
      key: string,
      methods: {[method_name: string]: (...args: Array<any>) => any},
    ): {[method_name: string]: boolean};
    remove(
      key: string,
      methods: {[method_name: string]: (...args: Array<any>) => any},
    ): {[method_name: string]: boolean};
    getModelNames(): Array<string>;
  }
}
