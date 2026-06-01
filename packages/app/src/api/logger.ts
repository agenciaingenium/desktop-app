export const logger = {
  notify: (e: Error, meta?: any) => {
    console.error(e);
    // eslint-disable-next-line no-console
    if (meta) console.info(meta);
  },
};
