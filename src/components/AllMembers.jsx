// src/components/AllMembers.jsx
import GroupMembers from "./GroupMembers";
import ExternalMembers from "./ExternalMembers";
import UserPicker from "./UserPicker";
import { useTranslation } from "react-i18next";

export default function AllMembers({
  members,
  canManage,
  onAddInternal,
  onRemoveInternal,
  groupId,
  loader,
  api, // { listExternalMembers, addExternalMember, deleteExternalMember, onCount }
}) {
  const { t } = useTranslation();

  return (
    <div>
      {/* Membres internes */}
      {canManage && (
        <div style={{ marginBottom: 12 }}>
          <UserPicker
            onSelect={onAddInternal}
            placeholder={t("am_add_internal_ph")}
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