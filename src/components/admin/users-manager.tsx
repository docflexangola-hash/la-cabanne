'use client';

import {
  Check,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  changeUserPassword,
  inviteUser,
  toggleUserActive,
} from '@/lib/actions/users';
import type { StaffMember } from '@/types/auth';
import { ConfirmDialog } from './confirm-dialog';

export type UserRowData = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager';
  isActive: boolean;
  createdAt: string;
};

export function UsersManager({
  currentUser,
  users,
}: {
  currentUser: StaffMember;
  users: UserRowData[];
}) {
  const [userList, setUserList] = useState(users);
  const [isPending, startTransition] = useTransition();

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager'>('manager');

  // Change password modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toggle active confirmation
  const [targetToggleUser, setTargetToggleUser] = useState<UserRowData | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Invite submit
  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFeedback(null);

    startTransition(async () => {
      const res = await inviteUser({
        email: inviteEmail,
        displayName: inviteName,
        role: inviteRole,
      });

      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Convite enviado' });
        setIsInviteOpen(false);
        setInviteEmail('');
        setInviteName('');
      } else {
        setFieldErrors(res.errors || {});
        setFeedback({ type: 'error', text: res.message || 'Erro ao convidar' });
      }
    });
  }

  // Toggle active
  async function handleToggleActiveConfirm() {
    if (!targetToggleUser) return;

    startTransition(async () => {
      const res = await toggleUserActive(
        targetToggleUser.id,
        !targetToggleUser.isActive,
      );

      if (res.success) {
        setUserList((prev) =>
          prev.map((u) =>
            u.id === targetToggleUser.id ? { ...u, isActive: !u.isActive } : u,
          ),
        );
        setFeedback({ type: 'ok', text: res.message || 'Estado alterado' });
      } else {
        setFeedback({ type: 'error', text: res.message || 'Erro ao alterar' });
      }
      setTargetToggleUser(null);
    });
  }

  // Password change submit
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setFeedback(null);

    startTransition(async () => {
      const res = await changeUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res.success) {
        setFeedback({ type: 'ok', text: res.message || 'Palavra-passe alterada' });
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFieldErrors(res.errors || {});
        setFeedback({ type: 'error', text: res.message || 'Erro ao alterar palavra-passe' });
      }
    });
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-deep">Utilizadores e Segurança</h1>
          <p className="mt-1 text-sm text-ink-2">
            Gestão das contas com acesso ao painel de administração e segurança.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
          >
            <KeyRound className="size-4" />
            Alterar Palavra-passe
          </button>

          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue px-4 text-sm font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" />
            Convidar Membro
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl p-4 text-sm ${
            feedback.type === 'ok'
              ? 'bg-[#2E7D5B]/10 text-[#2E7D5B] border border-[#2E7D5B]/20'
              : 'bg-danger/10 text-danger border border-danger/20'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold uppercase hover:underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-semibold text-decor uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Membro</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {userList.map((user) => {
                const isMe = user.id === currentUser.id;

                return (
                  <tr key={user.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{user.displayName}</span>
                        {isMe && (
                          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold text-deep">
                            Você
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-ink-2 font-mono">
                      {user.email || '—'}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-deep/10 text-deep'
                            : 'bg-surface-2 text-ink-2'
                        }`}
                      >
                        <Shield className="size-3" />
                        {user.role === 'admin' ? 'Administrador' : 'Gerente'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.isActive
                            ? 'bg-[#2E7D5B]/10 text-[#2E7D5B]'
                            : 'bg-danger/10 text-danger'
                        }`}
                      >
                        {user.isActive ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => setTargetToggleUser(user)}
                          disabled={isPending}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                            user.isActive
                              ? 'text-danger hover:bg-danger/10'
                              : 'text-[#2E7D5B] hover:bg-[#2E7D5B]/10'
                          }`}
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl text-deep">Convidar Membro</h2>
            <p className="mt-1 text-xs text-ink-2">
              O novo utilizador receberá um email do Supabase para aceder ao painel.
            </p>

            <form onSubmit={handleInviteSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Nome Completo <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex.: Maria Fernandes"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {fieldErrors.displayName && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.displayName[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="gerencia@lacabanne.ao"
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Papel no Sistema <span className="text-danger">*</span>
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'manager')}
                  className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                >
                  <option value="manager">Gerente (gere menu, preços e configurações)</option>
                  <option value="admin">Administrador (acesso total incluindo utilizadores)</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl">
            <h2 className="font-display text-2xl text-deep">Alterar Palavra-passe</h2>
            <p className="mt-1 text-xs text-ink-2">
              A palavra-passe deve ter no mínimo 12 caracteres para assegurar a protecção do painel.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Palavra-passe Actual <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                />
                {fieldErrors.currentPassword && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.currentPassword[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Nova Palavra-passe (mín. 12 caracteres) <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                  minLength={12}
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.newPassword[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-decor uppercase">
                  Confirmar Nova Palavra-passe <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:border-blue focus:outline-hidden"
                  required
                  minLength={12}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-danger">{fieldErrors.confirmPassword[0]}</p>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isPending}
                  className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Actualizar Palavra-passe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivation */}
      <ConfirmDialog
        isOpen={Boolean(targetToggleUser)}
        title={targetToggleUser?.isActive ? 'Desactivar Utilizador' : 'Activar Utilizador'}
        description={`Tem a certeza que deseja ${
          targetToggleUser?.isActive ? 'desactivar' : 'activar'
        } o acesso de "${targetToggleUser?.displayName}" ao painel administrativo?`}
        confirmLabel={targetToggleUser?.isActive ? 'Desactivar' : 'Activar'}
        isDestructive={targetToggleUser?.isActive}
        isLoading={isPending}
        onConfirm={handleToggleActiveConfirm}
        onCancel={() => setTargetToggleUser(null)}
      />
    </div>
  );
}
