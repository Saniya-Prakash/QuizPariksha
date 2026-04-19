class GeneralHelper {
  isClient() {
    return typeof window != "undefined" && window.document;
  };
}

export default new GeneralHelper();
