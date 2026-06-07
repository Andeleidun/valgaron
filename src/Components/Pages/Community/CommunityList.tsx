import { Grid, GridItem } from '../../Common';
import GroupCard from '../../Common/Card/GroupCard/GroupCard';
import type {
  CommonStringsType,
  CommunityGuidanceModeStringsType,
  CommunitySurfaceGuidanceType,
  GroupType,
  InteractionGateType,
  ModeType,
} from '../../../types';

/**
 * Props for CommunityList.
 */
type CommunityListProps = {
  groups: GroupType[];
  mode: ModeType;
  language: string;
  joinedGroupIds: Set<string>;
  onJoinToggle: (groupId: string) => void;
  onViewDetails: (groupId: string) => void;
  onMessageGroup: (groupId: string) => void;
  onEditGroup: (groupId: string) => void;
  isAdmin: (group: GroupType) => boolean;
  strings: {
    common: CommonStringsType;
    communityGuidance: CommunityGuidanceModeStringsType;
  };
  guidanceByGroupId: Map<string, CommunitySurfaceGuidanceType>;
  interactionGate?: InteractionGateType;
};

/**
 * Renders a list of group cards for the community page.
 */
const CommunityList = ({
  groups,
  mode,
  language,
  joinedGroupIds,
  onJoinToggle,
  onViewDetails,
  onMessageGroup,
  onEditGroup,
  isAdmin,
  strings,
  guidanceByGroupId,
  interactionGate,
}: CommunityListProps) => {
  return (
    <Grid spacing={2}>
      {groups.map((group) => (
        <GridItem xs={12} lg={6} key={group.id}>
          <GroupCard
            group={group}
            language={language}
            mode={mode}
            joined={joinedGroupIds.has(group.id)}
            onJoinToggle={onJoinToggle}
            onViewDetails={onViewDetails}
            onMessageGroup={onMessageGroup}
            onEditGroup={onEditGroup}
            isAdmin={isAdmin(group)}
            strings={strings}
            guidance={guidanceByGroupId.get(group.id)}
            interactionGate={interactionGate}
          />
        </GridItem>
      ))}
    </Grid>
  );
};

export default CommunityList;
