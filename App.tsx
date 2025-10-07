import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';

import { X, Plus, Trash2, Star as StarIcon, AlertCircle } from 'lucide-react-native';

// -----------------------------
// Types
// -----------------------------
type TicketStatus = 'Created' | 'Under Assistance' | 'Completed';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  rating?: number;
}

// -----------------------------
// Design constants
// -----------------------------
const COLORS = {
  background: '#F7F7F8',      // page background (very light)
  surface: '#FFFFFF',         // card / modal background
  muted: '#6B7280',           // body text muted
  text: '#111827',            // primary text
  border: '#E6E8EA',          // subtle border
  primary: '#2F6EA6',         // calm blue as primary (not flashy)
  primarySoft: '#E6F0FA',     // soft primary background
  success: '#2D7A4A',         // green for success
  caution: '#B9772A',         // softened orange
  danger: '#B83939',          // softer red
  ghost: '#F3F4F6',           // light grey surfaces
  icon: '#374151',            // icon color
  star: '#D97706',            // star color (muted amber)
};

const SPACING = {
  page: 16,
  card: 12,
  small: 8,
  tiny: 6,
  large: 20,
};

const TYPO = {
  h1: 22,
  h2: 18,
  body: 14,
  small: 12,
};

// -----------------------------
// Sample data 
// -----------------------------
const SAMPLE_TICKETS: Ticket[] = [
  { id: '1', title: 'Login button not responding', description: 'The login button does not work on mobile devices when tapped multiple times.', status: 'Completed', createdAt: '2025-10-05 14:32', rating: 5 },
  { id: '2', title: 'Dashboard loading slowly', description: 'Dashboard takes more than 10 seconds to load all widgets and data.', status: 'Under Assistance', createdAt: '2025-10-06 09:15' },
  { id: '3', title: 'Email notifications not sent', description: 'Users report not receiving email notifications for ticket updates.', status: 'Created', createdAt: '2025-10-06 16:45' },
  { id: '4', title: 'Profile picture upload fails', description: 'Error message appears when trying to upload profile pictures larger than 2MB.', status: 'Completed', createdAt: '2025-10-04 11:20', rating: 4 },
  { id: '5', title: 'Search function returns no results', description: 'The search bar does not return any results even with valid keywords.', status: 'Under Assistance', createdAt: '2025-10-07 08:00' },
];

// -----------------------------
// Utilities 
// -----------------------------
const generateId = () => `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// -----------------------------
// Small components 
// -----------------------------

const STATUS_CONFIG: Record<TicketStatus, { bg: string; text: string }> = {
  Created: { bg: COLORS.primarySoft, text: COLORS.primary },
  'Under Assistance': { bg: '#FEF6E8', text: COLORS.caution }, // soft light
  Completed: { bg: '#EEF8F0', text: COLORS.success },
};

const StatusBadge = ({ status }: { status: TicketStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusText, { color: cfg.text }]} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
};

const StarRating = ({ rating, onRate, editable }: { rating?: number; onRate?: (rating: number) => void; editable: boolean }) => {
  return (
    <View style={{ flexDirection: 'row', gap: SPACING.tiny }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (rating || 0);
        return (
          <TouchableOpacity
            key={star}
            onPress={() => editable && onRate?.(star)}
            activeOpacity={0.7}
            disabled={!editable}
            style={{ padding: 4 }}
          >
            <StarIcon size={18} color={filled ? COLORS.star : COLORS.border} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ModalWrapper = ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose: () => void }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>{children}</View>
      </View>
    </Modal>
  );
};

const ConfirmDialog = ({
  visible,
  title,
  message,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}) => {
  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: SPACING.page }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.small, marginBottom: SPACING.small }}>
          <View style={styles.alertIcon}>
            <AlertCircle size={18} color={COLORS.danger} />
          </View>
          <Text style={{ fontSize: TYPO.h2, fontWeight: '700', color: COLORS.text }}>{title}</Text>
        </View>

        <Text style={{ color: COLORS.muted, marginBottom: SPACING.large }}>{message}</Text>

        <View style={{ flexDirection: 'row', gap: SPACING.small }}>
          <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onConfirm();
              onClose();
            }}
            style={styles.btnDelete}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ModalWrapper>
  );
};

// Ticket Form 
const TicketForm = ({
  ticket,
  onSave,
  onClose,
}: {
  ticket?: Ticket;
  onSave: (data: Partial<Ticket>) => void;
  onClose: () => void;
}) => {
  const [title, setTitle] = useState(ticket?.title || '');
  const [description, setDescription] = useState(ticket?.description || '');
  const [status, setStatus] = useState<TicketStatus>(ticket?.status || 'Created');

  const canEditContent = !ticket || ticket.status === 'Created';
  const isEditing = !!ticket;

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), status });
    onClose();
  };

  return (
    <View style={{ padding: SPACING.page }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.small }}>
        <Text style={{ fontSize: TYPO.h1, fontWeight: '800', color: COLORS.text }}>{isEditing ? 'Edit Ticket' : 'New Ticket'}</Text>
        <TouchableOpacity onPress={onClose} style={{ padding: SPACING.tiny }}>
          <X size={20} color={COLORS.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.large }}>
        <View style={{ marginBottom: SPACING.small }}>
          <Text style={styles.label}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} editable={canEditContent} placeholder="Brief title" style={[styles.input, !canEditContent && styles.inputDisabled]} />
        </View>

        <View style={{ marginBottom: SPACING.small }}>
          <Text style={styles.label}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} editable={canEditContent} placeholder="Detailed description" multiline numberOfLines={4} style={[styles.textarea, !canEditContent && styles.inputDisabled]} />
        </View>

        {isEditing && (
          <View style={{ marginBottom: SPACING.small }}>
            <Text style={styles.label}>Status</Text>
            <View style={{ flexDirection: 'row', gap: SPACING.small }}>
              {(['Created', 'Under Assistance', 'Completed'] as TicketStatus[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[
                    styles.statusOption,
                    status === s ? { borderColor: COLORS.primary } : { borderColor: COLORS.border },
                  ]}
                >
                  <Text style={{ color: status === s ? COLORS.primary : COLORS.icon, fontWeight: status === s ? '700' : '600', fontSize: TYPO.body }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: SPACING.small, marginTop: SPACING.small }}>
          <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
            <Text style={{ color: COLORS.text, fontWeight: '700' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit} style={styles.btnCreate}>
            <Text style={{ color: 'white', fontWeight: '700' }}>{isEditing ? 'Save Changes' : 'Create Ticket'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Ticket Card 
const TicketCard = ({
  ticket,
  onEdit,
  onDelete,
  onStatusChange,
  onRate,
}: {
  ticket: Ticket;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TicketStatus) => void;
  onRate: (rating: number) => void;
}) => {
  const getActionButton = () => {
    if (ticket.status === 'Created') {
      return (
        <TouchableOpacity onPress={() => onStatusChange('Under Assistance')} style={styles.btnActionCaution}>
          <Text style={styles.btnActionText}>Start</Text>
        </TouchableOpacity>
      );
    }
    if (ticket.status === 'Under Assistance') {
      return (
        <TouchableOpacity onPress={() => onStatusChange('Completed')} style={styles.btnActionSuccess}>
          <Text style={styles.btnActionText}>Complete</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.card}>
      {/* Top row: title + delete icon */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.tiny }}>
        <View style={{ flex: 1, paddingRight: SPACING.small }}>
          <Text style={{ fontWeight: '800', color: COLORS.text, marginBottom: 2 }}>{ticket.title}</Text>
          <Text style={{ color: COLORS.muted, fontSize: TYPO.body }} numberOfLines={2}>
            {ticket.description}
          </Text>
        </View>

        <TouchableOpacity onPress={onDelete} style={{ padding: SPACING.tiny }}>
          <Trash2 size={18} color={COLORS.icon} />
        </TouchableOpacity>
      </View>

      {/* Middle row: status + date */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SPACING.small }}>
        <StatusBadge status={ticket.status} />
        <Text style={{ color: COLORS.muted, fontSize: TYPO.small }}>{ticket.createdAt}</Text>
      </View>

      {/* Rating (if completed) - slightly closer grouping */}
      {ticket.status === 'Completed' && (
        <View style={[styles.ratingBox, { marginTop: SPACING.small }]}>
          <Text style={{ fontSize: TYPO.small, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.tiny }}>Rate this resolution</Text>
          <StarRating rating={ticket.rating} editable={!ticket.rating} onRate={(r) => onRate(r)} />
          {ticket.rating ? <Text style={{ color: COLORS.muted, fontSize: TYPO.small, marginTop: SPACING.tiny }}>Thanks!</Text> : null}
        </View>
      )}

      {/* Actions: tightened spacing so actions feel attached to the card */}
      <View style={{ flexDirection: 'row', gap: SPACING.small, marginTop: SPACING.small }}>
        {getActionButton()}
        <TouchableOpacity onPress={onEdit} style={styles.btnEdit}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -----------------------------
// Main component 
// -----------------------------
export default function TicketTrackerMobile() {
  const [tickets, setTickets] = useState<Ticket[]>(SAMPLE_TICKETS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ visible: boolean; ticketId?: string }>({ visible: false });

  const handleCreateTicket = (data: Partial<Ticket>) => {
    const newTicket: Ticket = {
      id: generateId(),
      title: data.title!,
      description: data.description!,
      status: 'Created',
      createdAt: formatDate(),
    };
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleUpdateTicket = (data: Partial<Ticket>) => {
    if (!editingTicket) return;
    setTickets((prev) => prev.map((t) => (t.id === editingTicket.id ? { ...t, ...data } : t)));
    setEditingTicket(undefined);
  };

  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleRate = (id: string, rating: number) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, rating } : t)));
  };

  const openEditForm = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTicket(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ticket Tracker</Text>
          <Text style={styles.headerSubtitle}>Manage and track support tickets</Text>
        </View>
        <View style={{ marginLeft: 8 }} />
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {tickets.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <View style={styles.emptyIcon}>
              <AlertCircle size={36} color={COLORS.border} />
            </View>
            <Text style={{ color: COLORS.muted, fontSize: TYPO.h2, marginTop: SPACING.small }}>No tickets yet</Text>
            <Text style={{ color: COLORS.muted, fontSize: TYPO.small }}>Create your first ticket to get started</Text>
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TicketCard
                ticket={item}
                onEdit={() => openEditForm(item)}
                onDelete={() => setDeleteConfirm({ visible: true, ticketId: item.id })}
                onStatusChange={(status) => handleStatusChange(item.id, status)}
                onRate={(rating) => handleRate(item.id, rating)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: SPACING.small }} />}
            contentContainerStyle={{ paddingBottom: 140 }}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity onPress={() => setIsFormOpen(true)} style={styles.fab} activeOpacity={0.85}>
        <Plus size={22} color="white" />
      </TouchableOpacity>

      {/* Modals */}
      <ModalWrapper visible={isFormOpen} onClose={closeForm}>
        <TicketForm ticket={editingTicket} onSave={editingTicket ? handleUpdateTicket : handleCreateTicket} onClose={closeForm} />
      </ModalWrapper>

      <ConfirmDialog
        visible={!!deleteConfirm.visible}
        onClose={() => setDeleteConfirm({ visible: false })}
        onConfirm={() => deleteConfirm.ticketId && handleDeleteTicket(deleteConfirm.ticketId)}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This action cannot be undone."
      />
    </SafeAreaView>
  );
}

// -----------------------------
// Styles 
// -----------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.page,
    paddingVertical: SPACING.small,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: TYPO.h1, fontWeight: '900', color: COLORS.text },
  headerSubtitle: { color: COLORS.muted, marginTop: 4, fontSize: TYPO.body },

  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.page,
    paddingTop: SPACING.small,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  statusBadge: {
    paddingHorizontal: SPACING.small,
    paddingVertical: SPACING.tiny,
    borderRadius: 999,
    minWidth: 92,
    alignItems: 'center',
  },
  statusText: { fontSize: TYPO.small, fontWeight: '700' },

  ratingBox: {
    marginTop: SPACING.tiny,
    padding: SPACING.small,
    borderRadius: 10,
    backgroundColor: COLORS.ghost,
  },

  btnActionCaution: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.caution,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActionSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActionText: { color: 'white', fontWeight: '700', fontSize: TYPO.body },

  btnEdit: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form styles
  label: { fontSize: TYPO.small, fontWeight: '700', color: COLORS.icon, marginBottom: SPACING.tiny },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: COLORS.surface,
    fontSize: TYPO.body,
  },
  inputDisabled: { backgroundColor: COLORS.ghost, color: COLORS.muted },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: COLORS.surface,
    minHeight: 96,
    fontSize: TYPO.body,
  },

  statusOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
  },

  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCreate: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fab: {
    position: 'absolute',
    right: SPACING.page,
    bottom: SPACING.large,
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.page,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#FEEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: COLORS.ghost,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
