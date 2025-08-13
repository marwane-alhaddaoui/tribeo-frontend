import GroupMembers from "./GroupMembers";
import ExternalMembers from "./ExternalMembers";
import UserPicker from "./UserPicker";

export default function AllMembers({
  members,
  canManage,
  onAddInternal,
  onRemoveInternal,
  groupId,
  loader,
  api, // { listExternalMembers, addExternalMember, deleteExternalMember, onCount }
}) {
  return (
    <div>
      {/* Membres internes */}
      {canManage && (
        <div style={{ marginBottom: 12 }}>
          <UserPicker
            onSelect={onAddInternal}
            placeholder="Ajouter un membre interne (username / email)"
          />
        </div>
      )}
      <GroupMembers
        members={members}
        canManage={canManage}
        onRemove={onRemoveInternal}
      />

      <hr style={{ margin: "24px 0" }} />

      {/* Membres externes (charge sa liste + remonte le count) */}
      <ExternalMembers
        groupId={groupId}
        loader={loader}
        api={api}
      />
    </div>
  );
}
