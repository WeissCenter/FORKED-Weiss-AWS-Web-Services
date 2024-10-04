import { AdaptSettings } from '../../AdaptSettings';

export async function getAdaptSettings(
  db: any,
  TABLE_NAME: string,
  settingsID = 'default'
): Promise<AdaptSettings | undefined> {
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      type: 'Settings',
      id: `ID#${settingsID}`,
    },
  };

  const result = await db.get(getParams);

  return result?.Item as AdaptSettings;
}
