import React, { memo, useCallback, useState } from "react";
import { Ticket, Trash2, X, Pencil, Sparkles, Plus, QrCode, Share2 } from "lucide-react";
import type { Group, Member, Wichtel } from "../types";
import { CHRISTMAS_AVATARS, WICHTEL_AVATARS, FEATURE_FLAGS } from "../constants";
import { generateId } from "../services";
import { Card } from "./Card";
import { MemberAvatar } from "./MemberAvatar";

interface GroupsViewProps {
  groups: Group[];
  editingMemberId: string | null;
  editingGroupName: string | null;
  groupNameInput: string;
  newMemberName: string;
  newMemberNumber: string;
  selectedAvatar: string;
  onSetGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
  onSetEditingMemberId: (id: string | null) => void;
  onSetEditingGroupName: (id: string | null) => void;
  onSetGroupNameInput: (val: string) => void;
  onSetNewMemberName: (val: string) => void;
  onSetNewMemberNumber: (val: string) => void;
  onSetSelectedAvatar: (val: string) => void;
  onShowQr: () => void;
}

export const GroupsView = memo<GroupsViewProps>(
  ({
    groups,
    editingMemberId,
    editingGroupName,
    groupNameInput,
    newMemberName,
    newMemberNumber,
    selectedAvatar,
    onSetGroups,
    onSetEditingMemberId,
    onSetEditingGroupName,
    onSetGroupNameInput,
    onSetNewMemberName,
    onSetNewMemberNumber,
    onSetSelectedAvatar,
    onShowQr,
  }) => {
    const resetForm = useCallback(() => {
      onSetNewMemberName("");
      onSetNewMemberNumber("");
      onSetEditingMemberId(null);
      onSetEditingGroupName(null);
      onSetGroupNameInput("");
      onSetSelectedAvatar("🎅");
    }, [
      onSetNewMemberName,
      onSetNewMemberNumber,
      onSetEditingMemberId,
      onSetEditingGroupName,
      onSetGroupNameInput,
      onSetSelectedAvatar,
    ]);

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

    const handleAddMember = useCallback(
      (groupId: string) => {
        if (!newMemberNumber.trim()) return;
        const memberName = newMemberName.trim() || `Los ${newMemberNumber}`;
        onSetGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: [
                    ...g.members,
                    {
                      id: generateId(),
                      name: memberName,
                      number: newMemberNumber.trim(),
                      avatar: selectedAvatar,
                    },
                  ],
                }
              : g
          )
        );
        resetForm();
      },
      [newMemberName, newMemberNumber, selectedAvatar, onSetGroups, resetForm]
    );

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-display font-bold text-surface-800">
          Meine Losnummern
        </h2>

        {groups.map((group) => (
          <Card key={group.id} className="p-6" hover={false}>
            <div className="flex items-center gap-4 mb-6 border-b border-surface-100 pb-5">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-brand-50 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-brand-600" />
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
              {/* Add new member form */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/30 hover:border-brand-300 hover:bg-brand-50/20 transition-all">
                <h4 className="font-display font-bold text-surface-700 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Losnummer hinzufügen
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-surface-500 mb-1.5 block uppercase tracking-wider">
                      Losnummer
                    </label>
                    <input
                      placeholder="z.B. 1234"
                      className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400 font-mono"
                      value={newMemberNumber}
                      onChange={(e) => onSetNewMemberNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddMember(group.id);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surface-500 mb-1.5 block uppercase tracking-wider">
                      Name (optional)
                    </label>
                    <input
                      placeholder="z.B. Oma"
                      className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-200 focus:border-brand-300 outline-none bg-white text-surface-900 placeholder:text-surface-400"
                      value={newMemberName}
                      onChange={(e) => onSetNewMemberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddMember(group.id);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surface-500 mb-1.5 block uppercase tracking-wider">
                      Avatar
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {CHRISTMAS_AVATARS.slice(0, 10).map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          onClick={() => onSetSelectedAvatar(avatar)}
                          className={`w-10 h-10 flex items-center justify-center text-lg rounded-xl border-2 transition-all btn-press
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
                  <button
                    type="button"
                    onClick={() => handleAddMember(group.id)}
                    disabled={!newMemberNumber.trim()}
                    className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 rounded-xl hover:from-brand-600 hover:to-brand-700 font-semibold shadow-md btn-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Hinzufügen
                  </button>
                </div>
              </div>

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

            </div>

            {/* Wichtel Section */}
            {FEATURE_FLAGS.WICHTEL_ENABLED && (
              <WichtelSection
                group={group}
                onSetGroups={onSetGroups}
              />
            )}
          </Card>
        ))}

        {/* Share Section */}
        <Card className="p-6" hover={false}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-50 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-accent-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg text-surface-800">
                Losnummern teilen
              </h3>
              <p className="text-sm text-surface-500">
                Teile deine Losnummern mit Familie und Freunden
              </p>
            </div>
          </div>
          <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
            <p className="text-sm text-surface-600 mb-4">
              Teile deine Mitgliederliste mit Familie oder Freunden. Die Daten werden einmalig übernommen – danach hat jeder seine eigene Kopie.
            </p>
            <button
              onClick={onShowQr}
              className="flex items-center gap-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-5 py-2.5 rounded-xl hover:from-accent-600 hover:to-accent-700 transition shadow-md btn-press font-medium"
            >
              <QrCode className="w-4 h-4" />
              Link & QR-Code erstellen
            </button>
          </div>
        </Card>
      </div>
    );
  }
);

GroupsView.displayName = "GroupsView";

// Wichtel Section Component
interface WichtelSectionProps {
  group: Group;
  onSetGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
}

const WichtelSection = memo<WichtelSectionProps>(({ group, onSetGroups }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingWichtelId, setEditingWichtelId] = useState<string | null>(null);
  const [wichtelName, setWichtelName] = useState("");
  const [wichtelAvatar, setWichtelAvatar] = useState("👶");

  const resetForm = useCallback(() => {
    setIsAdding(false);
    setEditingWichtelId(null);
    setWichtelName("");
    setWichtelAvatar("👶");
  }, []);

  const handleAddWichtel = useCallback(() => {
    if (!wichtelName.trim()) return;
    const wichtel: Wichtel = {
      id: generateId(),
      name: wichtelName.trim(),
      avatar: wichtelAvatar,
    };
    onSetGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? { ...g, wichtel: [...(g.wichtel || []), wichtel] }
          : g
      )
    );
    resetForm();
  }, [wichtelName, wichtelAvatar, group.id, onSetGroups, resetForm]);

  const handleEditWichtel = useCallback(() => {
    if (!wichtelName.trim() || !editingWichtelId) return;
    onSetGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              wichtel: (g.wichtel || []).map((w) =>
                w.id === editingWichtelId
                  ? { ...w, name: wichtelName.trim(), avatar: wichtelAvatar }
                  : w
              ),
            }
          : g
      )
    );
    resetForm();
  }, [wichtelName, wichtelAvatar, editingWichtelId, group.id, onSetGroups, resetForm]);

  const startEditWichtel = useCallback((wichtel: Wichtel) => {
    setEditingWichtelId(wichtel.id);
    setWichtelName(wichtel.name);
    setWichtelAvatar(wichtel.avatar);
  }, []);

  const removeWichtel = useCallback(
    (wichtelId: string) => {
      onSetGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, wichtel: (g.wichtel || []).filter((w) => w.id !== wichtelId) }
            : g
        )
      );
    },
    [group.id, onSetGroups]
  );

  const wichtelList = group.wichtel || [];

  return (
    <div className="mt-6 pt-6 border-t border-surface-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-gold-100 to-gold-50 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-gold-600" />
        </div>
        <div>
          <h4 className="font-display font-bold text-surface-700">Wichtel</h4>
          <p className="text-xs text-surface-400">
            Familienmitglieder ohne Losnummer (Babys, Haustiere, etc.)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {wichtelList.map((wichtel) =>
          editingWichtelId === wichtel.id ? (
            <div
              key={wichtel.id}
              className="w-full p-4 rounded-xl border-2 border-gold-300 bg-gold-50/30"
            >
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-semibold text-surface-700">Wichtel bearbeiten</h5>
                <button onClick={resetForm} className="text-surface-400 hover:text-surface-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    placeholder="z.B. Baby Emma, Hund Bello"
                    className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-gold-200 focus:border-gold-300 outline-none bg-white"
                    value={wichtelName}
                    onChange={(e) => setWichtelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEditWichtel();
                      if (e.key === "Escape") resetForm();
                    }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                    Avatar
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {WICHTEL_AVATARS.map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setWichtelAvatar(avatar)}
                        className={`w-10 h-10 flex items-center justify-center text-lg rounded-xl border-2 transition-all btn-press
                          ${
                            wichtelAvatar === avatar
                              ? "ring-2 ring-gold-300 scale-110 border-gold-500 bg-white shadow-md"
                              : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                          }
                        `}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleEditWichtel}
                    className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 text-white py-2.5 rounded-xl hover:from-gold-600 hover:to-gold-700 font-semibold shadow-md btn-press"
                  >
                    Speichern
                  </button>
                  <button
                    onClick={resetForm}
                    className="flex-1 bg-surface-100 text-surface-600 py-2.5 rounded-xl hover:bg-surface-200 font-medium btn-press"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={wichtel.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-surface-100 bg-surface-50/50 hover:bg-white hover:border-gold-200 hover:shadow-soft transition cursor-pointer group/wichtel"
              onClick={() => startEditWichtel(wichtel)}
            >
              <span className="text-2xl">{wichtel.avatar}</span>
              <span className="font-medium text-surface-700 text-sm">{wichtel.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeWichtel(wichtel.id);
                }}
                className="text-surface-300 hover:text-brand-500 transition-all p-1 opacity-0 group-hover/wichtel:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        )}

        {isAdding ? (
          <div className="w-full p-4 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50/30">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-semibold text-surface-700">Neuen Wichtel hinzufügen</h5>
              <button onClick={resetForm} className="text-surface-400 hover:text-surface-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                  Name
                </label>
                <input
                  placeholder="z.B. Baby Emma, Hund Bello"
                  className="w-full text-sm p-3 border-2 border-surface-200 rounded-xl focus:ring-2 focus:ring-gold-200 focus:border-gold-300 outline-none bg-white"
                  value={wichtelName}
                  onChange={(e) => setWichtelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddWichtel();
                    if (e.key === "Escape") resetForm();
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-surface-500 mb-2 block uppercase tracking-wider">
                  Avatar
                </label>
                <div className="flex gap-2 flex-wrap">
                  {WICHTEL_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => setWichtelAvatar(avatar)}
                      className={`w-10 h-10 flex items-center justify-center text-lg rounded-xl border-2 transition-all btn-press
                        ${
                          wichtelAvatar === avatar
                            ? "ring-2 ring-gold-300 scale-110 border-gold-500 bg-white shadow-md"
                            : "border-surface-200 bg-surface-50 hover:bg-white hover:border-surface-300"
                        }
                      `}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddWichtel}
                  className="flex-1 bg-gradient-to-r from-gold-500 to-gold-600 text-white py-2.5 rounded-xl hover:from-gold-600 hover:to-gold-700 font-semibold shadow-md btn-press"
                >
                  Wichtel hinzufügen
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-surface-100 text-surface-600 py-2.5 rounded-xl hover:bg-surface-200 font-medium btn-press"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-surface-200 text-surface-400 hover:border-gold-300 hover:text-gold-600 hover:bg-gold-50/30 transition-all btn-press"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Wichtel hinzufügen</span>
          </button>
        )}
      </div>
    </div>
  );
});

WichtelSection.displayName = "WichtelSection";
