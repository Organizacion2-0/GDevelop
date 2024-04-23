// @flow
import { Trans, t } from '@lingui/macro';

import * as React from 'react';
import Avatar from '@material-ui/core/Avatar';
import { Column } from '../UI/Grid';
import {
  ColumnStackLayout,
  LineStackLayout,
  ResponsiveLineStackLayout,
} from '../UI/Layout';
import PlaceholderLoader from '../UI/PlaceholderLoader';
import { getGravatarUrl } from '../UI/GravatarUrl';
import Text from '../UI/Text';
import { I18n } from '@lingui/react';
import PlaceholderError from '../UI/PlaceholderError';
import RaisedButton from '../UI/RaisedButton';
import { type Achievement } from '../Utils/GDevelopServices/Badge';
import Window from '../Utils/Window';
import { GDevelopGamesPlatform } from '../Utils/GDevelopServices/ApiConfigs';
import FlatButton from '../UI/FlatButton';
import ShareExternal from '../UI/CustomSvgIcons/ShareExternal';
import {
  communityLinksConfig,
  type CommunityLinks,
  syncDiscordUsername,
} from '../Utils/GDevelopServices/User';
import AuthenticatedUserContext from './AuthenticatedUserContext';
import IconButton from '../UI/IconButton';
import Refresh from '../UI/CustomSvgIcons/Refresh';
import Check from '../UI/CustomSvgIcons/Check';
import { MarkdownText } from '../UI/MarkdownText';
import useAlertDialog from '../UI/Alert/useAlertDialog';
import {
  canBenefitFromDiscordRole,
  type Subscription,
} from '../Utils/GDevelopServices/Usage';
import { extractGDevelopApiErrorStatusAndCode } from '../Utils/GDevelopServices/Errors';

const CommunityLinksLines = ({
  communityLinks,
}: {|
  communityLinks: Array<{ url: ?string, icon: React.Node }>,
|}) => (
  <ColumnStackLayout expand noMargin>
    {communityLinks.map(({ url, icon }, index) =>
      url ? (
        <LineStackLayout noMargin alignItems="center" key={index}>
          {icon}
          <Text noMargin>{url}</Text>
        </LineStackLayout>
      ) : null
    )}
  </ColumnStackLayout>
);

type DisplayedProfile = {
  id: string,
  +email?: string, // the "+" allows handling both public and private profile
  username: ?string,
  description: ?string,
  donateLink: ?string,
  discordUsername: ?string,
  githubUsername: ?string,
  +isEmailAutogenerated?: boolean, // the "+" allows handling both public and private profile
  +communityLinks?: CommunityLinks, // the "+" allows handling both public and private profile
};

type Props = {|
  profile: ?DisplayedProfile,
  subscription?: ?Subscription,
  achievements: ?Array<Achievement>,
  error?: ?Error,
  onRetry?: () => void,
  onOpenChangeEmailDialog?: () => void,
  onOpenEditProfileDialog?: () => void,
|};

const ProfileDetails = ({
  profile,
  subscription,
  achievements,
  error,
  onRetry,
  onOpenChangeEmailDialog,
  onOpenEditProfileDialog,
}: Props) => {
  const email = profile ? profile.email : null;
  const donateLink = profile ? profile.donateLink : null;
  const discordUsername = profile ? profile.discordUsername : null;
  const githubUsername = profile ? profile.githubUsername : null;
  const communityLinks = (profile && profile.communityLinks) || {};
  const personalWebsiteLink = communityLinks
    ? communityLinks.personalWebsiteLink
    : null;
  const personalWebsite2Link = profile
    ? communityLinks.personalWebsite2Link
    : null;
  const twitterUsername = profile ? communityLinks.twitterUsername : null;
  const facebookUsername = profile ? communityLinks.facebookUsername : null;
  const youtubeUsername = profile ? communityLinks.youtubeUsername : null;
  const tiktokUsername = profile ? communityLinks.tiktokUsername : null;
  const instagramUsername = profile ? communityLinks.instagramUsername : null;
  const redditUsername = profile ? communityLinks.redditUsername : null;
  const snapchatUsername = profile ? communityLinks.snapchatUsername : null;
  const discordServerLink = profile ? communityLinks.discordServerLink : null;
  const { getAuthorizationHeader } = React.useContext(AuthenticatedUserContext);
  const { showAlert } = useAlertDialog();
  const githubStarAchievement =
    (achievements &&
      achievements.find(achievement => achievement.id === 'github-star')) ||
    null;

  const [
    discordUsernameSyncStatus,
    setDiscordUsernameSyncStatus,
  ] = React.useState<null | 'syncing' | 'success'>(null);

  const onSyncDiscordUsername = React.useCallback(
    async () => {
      if (!profile) return;
      setDiscordUsernameSyncStatus('syncing');
      try {
        await syncDiscordUsername(getAuthorizationHeader, profile.id);
        setDiscordUsernameSyncStatus('success');
      } catch (error) {
        console.error('Error while syncing discord username:', error);
        const extractedStatusAndCode = extractGDevelopApiErrorStatusAndCode(
          error
        );
        if (
          extractedStatusAndCode &&
          extractedStatusAndCode.status === 400 &&
          extractedStatusAndCode.code ===
            'discord-role-update/discord-user-not-found'
        ) {
          showAlert({
            title: t`Discord user not found`,
            message: t`Ensure you don't have any typo in your username and that you have joined the GDevelop Discord server.`,
          });
          return;
        }
        showAlert({
          title: t`Discord username sync failed`,
          message: t`Something went wrong while syncing your Discord username. Please try again later.`,
        });
      } finally {
        // Wait a bit to avoid spam and allow showing the success icon.
        setTimeout(() => setDiscordUsernameSyncStatus(null), 3000);
      }
    },
    [getAuthorizationHeader, profile, showAlert]
  );

  const canUserBenefitFromDiscordRole = canBenefitFromDiscordRole(subscription);

  if (error)
    return (
      <PlaceholderError onRetry={onRetry}>
        <Trans>
          Unable to load the profile, please verify your internet connection or
          try again later.
        </Trans>
      </PlaceholderError>
    );

  if (!profile) {
    return <PlaceholderLoader />;
  }

  return (
    <I18n>
      {({ i18n }) => (
        <ResponsiveLineStackLayout>
          <Avatar src={getGravatarUrl(email || '', { size: 40 })} />
          <ColumnStackLayout noMargin expand>
            <ResponsiveLineStackLayout justifyContent="space-between" noMargin>
              <Text
                size="block-title"
                allowBrowserAutoTranslate={!profile.username}
                style={{
                  opacity: profile.username ? 1.0 : 0.5,
                }}
              >
                {profile.username ||
                  i18n._(t`Edit your profile to pick a username!`)}
              </Text>
            </ResponsiveLineStackLayout>
            {email && (
              <Column noMargin>
                <Text noMargin size="body-small">
                  <Trans>Email</Trans>
                </Text>
                <Text>{email}</Text>
              </Column>
            )}
            <Column noMargin>
              <LineStackLayout noMargin alignItems="center">
                <Text noMargin size="body-small">
                  <Trans>Discord username</Trans>
                </Text>
                {canUserBenefitFromDiscordRole && !!discordUsername && (
                  <IconButton
                    onClick={onSyncDiscordUsername}
                    disabled={discordUsernameSyncStatus !== null}
                    tooltip={t`Sync your role on GDevelop's Discord server`}
                    size="small"
                  >
                    {discordUsernameSyncStatus === 'success' ? (
                      <Check fontSize="small" />
                    ) : (
                      <Refresh fontSize="small" />
                    )}
                  </IconButton>
                )}
              </LineStackLayout>
              <Text>
                {!discordUsername ? (
                  !canUserBenefitFromDiscordRole ? (
                    <MarkdownText
                      translatableSource={t`No discord username defined. Add it and get a Gold, Pro or Education subscription to claim your role on the [GDevelop Discord](https://discord.gg/gdevelop).`}
                    />
                  ) : (
                    <MarkdownText
                      translatableSource={t`No discord username defined. Add it to claim your role on the [GDevelop Discord](https://discord.gg/gdevelop).`}
                    />
                  )
                ) : (
                  <>
                    {discordUsername}
                    {!canUserBenefitFromDiscordRole && (
                      <>
                        {' - '}
                        <MarkdownText
                          translatableSource={t`Get a Gold or Pro subscription to claim your role on the [GDevelop Discord](https://discord.gg/gdevelop).`}
                        />
                      </>
                    )}
                  </>
                )}
              </Text>
            </Column>
            {
              <Column noMargin>
                <Text noMargin size="body-small">
                  <Trans>GitHub username</Trans>
                </Text>
                <Text>
                  {!githubUsername ? (
                    <MarkdownText
                      translatableSource={t`[Star the GDevelop repository](https://github.com/4ian/GDevelop) and add your GitHub username here to get ${(githubStarAchievement &&
                        githubStarAchievement.rewardValueInCredits) ||
                        '-'} free credits as a thank you!.`}
                    />
                  ) : (
                    githubUsername
                  )}
                </Text>
              </Column>
            }
            <Column noMargin>
              <Text noMargin size="body-small">
                <Trans>Bio</Trans>
              </Text>
              <Text>
                {profile.description || <Trans>No bio defined.</Trans>}
              </Text>
            </Column>
            <CommunityLinksLines
              communityLinks={[
                {
                  url: personalWebsiteLink,
                  icon: communityLinksConfig.personalWebsiteLink.icon,
                },
                {
                  url: personalWebsite2Link,
                  icon: communityLinksConfig.personalWebsite2Link.icon,
                },
                {
                  url: twitterUsername
                    ? communityLinksConfig.twitterUsername.prefix +
                      twitterUsername
                    : undefined,
                  icon: communityLinksConfig.twitterUsername.icon,
                },
                {
                  url: facebookUsername
                    ? communityLinksConfig.facebookUsername.prefix +
                      facebookUsername
                    : undefined,
                  icon: communityLinksConfig.facebookUsername.icon,
                },
                {
                  url: youtubeUsername
                    ? communityLinksConfig.youtubeUsername.prefix +
                      youtubeUsername
                    : undefined,
                  icon: communityLinksConfig.youtubeUsername.icon,
                },
                {
                  url: tiktokUsername
                    ? communityLinksConfig.tiktokUsername.prefix +
                      tiktokUsername
                    : undefined,
                  icon: communityLinksConfig.tiktokUsername.icon,
                },
                {
                  url: instagramUsername
                    ? communityLinksConfig.instagramUsername.prefix +
                      instagramUsername
                    : undefined,
                  icon: communityLinksConfig.instagramUsername.icon,
                },
                {
                  url: redditUsername
                    ? communityLinksConfig.redditUsername.prefix +
                      redditUsername
                    : undefined,
                  icon: communityLinksConfig.redditUsername.icon,
                },
                {
                  url: snapchatUsername
                    ? communityLinksConfig.snapchatUsername.prefix +
                      snapchatUsername
                    : undefined,
                  icon: communityLinksConfig.snapchatUsername.icon,
                },
                {
                  url: discordServerLink,
                  icon: communityLinksConfig.discordServerLink.icon,
                },
              ]}
            />

            <Column noMargin>
              <Text noMargin size="body-small">
                <Trans>Donate link</Trans>
              </Text>
              <Text>{donateLink || <Trans>No link defined.</Trans>}</Text>
            </Column>

            <ResponsiveLineStackLayout justifyContent="flex-start" noMargin>
              <RaisedButton
                label={<Trans>Edit my profile</Trans>}
                primary
                onClick={onOpenEditProfileDialog}
              />
              <FlatButton
                label={<Trans>Change my email</Trans>}
                onClick={onOpenChangeEmailDialog}
                disabled={profile.isEmailAutogenerated}
              />
              <FlatButton
                label={<Trans>Access public profile</Trans>}
                onClick={() =>
                  Window.openExternalURL(
                    GDevelopGamesPlatform.getUserPublicProfileUrl(
                      profile.id,
                      profile.username
                    )
                  )
                }
                leftIcon={<ShareExternal />}
              />
            </ResponsiveLineStackLayout>
          </ColumnStackLayout>
        </ResponsiveLineStackLayout>
      )}
    </I18n>
  );
};

export default ProfileDetails;
