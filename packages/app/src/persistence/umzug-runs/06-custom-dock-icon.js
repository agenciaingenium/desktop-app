// Migration: 06-custom-dock-icon.js
// Adds the `customIconPath` column to the `application` table. When
// non-null, the GraphQL `interpretedIconURL` resolver returns this
// path (as a file:// URL) instead of falling back to the manifest
// icon. The column is the absolute path on disk inside the userData
// dir (~/Library/Application Support/Station/icons/<appId>.<ext>).

module.exports = {
  up: async (query, DataTypes) => {
    await query.addColumn('application', 'customIconPath', {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  },
  down: async (query) => {
    await query.removeColumn('application', 'customIconPath');
  },
};
