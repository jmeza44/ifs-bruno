import { listProfiles } from '@core/profile-store';
import { AddFlow } from '@tui/AddFlow';
import { t } from 'i18next';
import { render } from 'ink';
import pc from 'picocolors';
import React from 'react';

export async function runAdd(
  specPath: string | undefined,
  collectionPath: string | undefined,
  profileName?: string,
): Promise<void> {
  if (!specPath && !profileName) {
    const profiles = listProfiles();
    const message = profiles.length === 0 ? t('add.need_setup') : t('add.need_spec_or_profile');
    console.error(pc.red('✗') + ' ' + message);
    process.exit(1);
  }

  process.stdin.resume();
  process.stdin.setRawMode(true);

  const { waitUntilExit } = render(
    React.createElement(AddFlow, { specPath, collectionPath, profileName }),
    { stdin: process.stdin },
  );

  await waitUntilExit();
}
