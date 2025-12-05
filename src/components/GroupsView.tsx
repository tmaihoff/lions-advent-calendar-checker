import React, { memo, useCallback } from "react";
import { Users, Plus, Trash2, X, Pencil } from "lucide-react";
import type { Group, Member } from "../types";
import { CHRISTMAS_AVATARS } from "../constants";
import { generateId } from "../services";
import { Card } from "./Card";
import { MemberAvatar } from "./MemberAvatar";

interface GroupsViewProps {
  groups: Group[];
  editingId: string | null;
  editingMemberId: string | null;
  editingGroupName: string | null;
  groupNameInput: string;
  newMemberName: string;
  newMemberNumber: string;
  selectedAvatar: string;
  onSetGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
  onSetEditingId: (id: string | null) => void;
  onSetEditingMemberId: (id: string | null) => void;
  onSetEditingGroupName: (id: string | null) => void;
  onSetGroupNameInput: (val: string) => void;
  onSetNewMemberName: (val: string) => void;
  onSetNewMemberNumber: (val: string) => void;
  onSetSelectedAvatar: (val: string) => void;
}

export const GroupsView = memo<GroupsViewProps>(
  ({
    groups,
    editingId,
    editingMemberId,
    editingGroupName,
    groupNameInput,
    newMemberName,
    newMemberNumber,
    selectedAvatar,
    onSetGroups,
    onSetEditingId,
    onSetEditingMemberId,
    onSetEditingGroupName,
    onSetGroupNameInput,
    onSetNewMemberName,
    onSetNewMemberNumber,
    onSetSelectedAvatar,
  }) => {
    const resetForm = useCallback(() => {
      onSetNewMemberName("");
      onSetNewMemberNumber("");
      onSetEditingId(null);
      onSetEditingMemberId(null);
      onSetEditingGroupName(null);
      onSetGroupNameInput("");
      onSetSelectedAvatar("🎅");
    }, [
      onSetNewMemberName,
      onSetNewMemberNumber,
      onSetEditingId,
      onSetEditingMemberId,
      onSetEditingGroupName,
      onSetGroupNameInput,
      onSetSelectedAvatar,
    ]);

    const handleAddMember = useCallback(
      (groupId: string) => {
        if (!newMemberName || !newMemberNumber) return;
        const member: Member = {
          id: generateId(),
          name: newMemberName,
          number: newMemberNumber,
          avatar: selectedAvatar,
        };
        onSetGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, members: [...g.members, member] } : g
          )
        );
        resetForm();
      },
      [newMemberName, newMemberNumber, selectedAvatar, onSetGroups, resetForm]
    );

    const handleEditMember = useCallback(
      (groupId: string, memberId: string) => {
        if (!newMemberName || !newMemberNumber) return;
        onSetGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: g.members.map((m) =>
                    m.id === memberId
                      ? {
                          ...m,
                          name: newMemberName,
                          number: newMemberNumber,
                          avatar: selectedAvatar,
                        }
                      : m
                  ),
                }
              : g
          )
        );
        resetForm();
      },
      [newMemberName, newMemberNumber, selectedAvatar, onSetGroups, resetForm]
    );

    const startEditMember = useCallback(
      (member: Member) => {
        onSetEditingMemberId(member.id);
        onSetNewMemberName(member.name);
        onSetNewMemberNumber(member.number);
        onSetSelectedAvatar(member.avatar);
      },
      [onSetEditingMemberId, onSetNewMemberName, onSetNewMemberNumber, onSetSelectedAvatar]
    );

    const startEditGroupName = useCallback(
      (group: Group) => {
        onSetEditingGroupName(group.id);
        onSetGroupNameInput(group.name);
      },
      [onSetEditingGroupName, onSetGroupNameInput]
    );

    const handleSaveGroupName = useCallback(
      (groupId: string) => {
        if (!groupNameInput.trim()) return;
        onSetGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, name: groupNameInput.trim() } : g
          )
        );
        onSetEditingGroupName(null);
        onSetGroupNameInput("");
      },
      [groupNameInput, onSetGroups, onSetEditingGroupName, onSetGroupNameInput]
    );

    const removeMember = useCallback(
      (groupId: string, memberId: string) => {
        onSetGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? { ...g, members: g.members.filter((m) => m.id !== memberId) }
              : g
          )
        );
      },
      [onSetGroups]
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold text-surface-800">
          Meine Gruppe
        </h2>

        {groups.map((group) => (
          <Card key={group.id} className="p-6" hover={false}>
            <div className="flex items-center gap-4 mb-6 border-b border-surface-100 pb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex-1">
                {editingGroupName === group.id ? (
                  <div className="flex items-center gap-3">
                    <input
                      value={groupNameInput}
                      onChange={(e) => onSetGroupNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveGroupName(group.id);
                        if (e.key === "Escape") resetForm();
                      }}
                      className="font-display font-bold text-lg text-surface-800 bg-white border-2 border-brand-300 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-brand-200 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveGroupName(group.id)}
                      className="text-accent-600 hover:text-accent-700 text-sm font-semibold"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={resetForm}
                      className="text-surface-400 hover:text-surface-600 text-sm"
                    >
                      Abbrechen
                    </button>
                  </div>
                ) : (
                  <div
                    className="group/name cursor-pointer"
                    onClick={() => startEditGroupName(group)}
                  >
                    <h3 className="font-display font-bold text-lg text-surface-800 flex items-center gap-2">
                      {group.name}
                      <Pencil className="w-4 h-4 text-surface-300 opacity-0 group-hover/name:opacity-100 transition-opacity" />
                    </h3>
                  </div>
                )}
                <p className="text-sm text-surface-500">
                  {group.members.length} Mitglieder
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.members.map((member) =>
                editingMemberId === member.id ? (
                  <div
                    key={member.id}
                    className="p-5 rounded-2xl border-2 border-brand-300 bg-brand-50/30 col-span-1 md:col-span-2 lg:col-span-3"
                  >
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="font-display font-bold text-surface-700">
                        Mitglied bearbeiten
                      </h4>
                      <button
                        onClick={resetForm}
                        className="text-surface-400 hover:text-surface-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Name
                          </label>
                          <input
                            placeholder="z.B. Oma"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400"
                            value={newMemberName}
                            onChange={(e) => onSetNewMemberName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditMember(group.id, member.id);
                              if (e.key === "Escape") resetForm();
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Losnummer
                          </label>
                          <input
                            placeholder="z.B. 1234"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400 font-mono"
                            value={newMemberNumber}
                            onChange={(e) => onSetNewMemberNumber(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditMember(group.id, member.id);
                              if (e.key === "Escape") resetForm();
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                          Avatar wählen
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {CHRISTMAS_AVATARS.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => onSetSelectedAvatar(avatar)}
                              className={`w-11 h-11 flex items-center justify-center text-xl rounded-xl border-2 transition-all btn-press
                                ${
                                  selectedAvatar === avatar
                                    ? "ring-2 ring-brand-300 scale-110 border-brand-500 bg-white shadow-md"
                                    : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                                }
                              `}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="pt-5 flex gap-3">
                      <button
                        onClick={() => handleEditMember(group.id, member.id)}
                        className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 rounded-xl hover:from-accent-600 hover:to-accent-700 font-semibold shadow-md btn-press"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-surface-100 text-surface-600 py-3 rounded-xl hover:bg-surface-200 font-medium btn-press"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-surface-100 bg-surface-50/50 hover:bg-white hover:border-surface-200 hover:shadow-soft transition cursor-pointer group/member"
                    onClick={() => startEditMember(member)}
                  >
                    <MemberAvatar
                      avatar={member.avatar}
                      className="w-14 h-14 text-2xl border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-surface-800 truncate">
                          {member.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditMember(member);
                            }}
                            className="text-surface-300 hover:text-accent-500 opacity-0 group-hover/member:opacity-100 transition-all p-1"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMember(group.id, member.id);
                            }}
                            className="text-surface-300 hover:text-brand-500 transition-all p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <span className="font-mono bg-surface-200/70 px-2 py-1 rounded-lg text-surface-600 text-sm mt-1 inline-block">
                        #{member.number}
                      </span>
                    </div>
                  </div>
                )
              )}

              <div
                className={`rounded-xl border-2 border-dashed overflow-hidden transition-all ${
                  editingId === group.id
                    ? "bg-accent-50/30 border-accent-300 col-span-1 md:col-span-2 lg:col-span-3"
                    : "border-surface-200 hover:border-surface-300 hover:bg-surface-50 min-h-[100px]"
                }`}
              >
                {editingId === group.id ? (
                  <div className="p-5 space-y-5">
                    <div className="flex justify-between items-center">
                      <h4 className="font-display font-bold text-surface-700">
                        Neues Mitglied hinzufügen
                      </h4>
                      <button
                        onClick={resetForm}
                        className="text-surface-400 hover:text-surface-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Name
                          </label>
                          <input
                            placeholder="z.B. Oma"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-accent-200 focus:border-accent-300 outline-none bg-white text-surface-900 placeholder:text-surface-400"
                            value={newMemberName}
                            onChange={(e) => onSetNewMemberName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddMember(group.id);
                              if (e.key === "Escape") resetForm();
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                            Losnummer
                          </label>
                          <input
                            placeholder="z.B. 1234"
                            className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-accent-200 focus:border-accent-300 outline-none bg-white text-surface-900 placeholder:text-surface-400 font-mono"
                            value={newMemberNumber}
                            onChange={(e) => onSetNewMemberNumber(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddMember(group.id);
                              if (e.key === "Escape") resetForm();
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                          Avatar wählen
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {CHRISTMAS_AVATARS.map((avatar) => (
                            <button
                              key={avatar}
                              onClick={() => onSetSelectedAvatar(avatar)}
                              className={`w-11 h-11 flex items-center justify-center text-xl rounded-xl border-2 transition-all btn-press
                                ${
                                  selectedAvatar === avatar
                                    ? "ring-2 ring-accent-300 scale-110 border-accent-500 bg-white shadow-md"
                                    : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                                }
                              `}
                            >
                              {avatar}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100 mt-4">
                          <MemberAvatar
                            avatar={selectedAvatar}
                            className="w-12 h-12 text-2xl"
                          />
                          <span className="text-sm text-surface-400 font-medium">
                            Vorschau
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => handleAddMember(group.id)}
                        className="flex-1 bg-gradient-to-r from-accent-500 to-accent-600 text-white py-3 rounded-xl hover:from-accent-600 hover:to-accent-700 font-semibold shadow-md btn-press"
                      >
                        Mitglied speichern
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 bg-surface-100 text-surface-600 py-3 rounded-xl hover:bg-surface-200 font-medium btn-press"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onSetEditingId(group.id)}
                    className="w-full h-full flex flex-col items-center justify-center text-surface-400 gap-2 py-6 hover:text-accent-500 transition-colors"
                  >
                    <div className="p-3 bg-surface-100 rounded-xl group-hover:bg-accent-100 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold">
                      Mitglied hinzufügen
                    </span>
                  </button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }
);

GroupsView.displayName = "GroupsView";
