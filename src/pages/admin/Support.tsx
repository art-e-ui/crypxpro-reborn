import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, MessageCircle, Phone, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import CubeSpinner from '@/components/shared/CubeSpinner';

const AdminSupport = () => {
  const [formData, setFormData] = useState({ email: '', telegram: '', whatsapp: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from('support_config').select('*').limit(1).maybeSingle();
      if (fetchError) throw fetchError;
      if (data) {
        setFormData({ email: data.email || '', telegram: data.telegram || '', whatsapp: data.whatsapp || '' });
        setConfigId(data.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load support config.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (configId) {
      await supabase.from('support_config').update(formData).eq('id', configId);
    } else {
      const { data } = await supabase.from('support_config').insert(formData).select().single();
      if (data) setConfigId(data.id);
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Support Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage contact channels for customer support.</p>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <CubeSpinner label="Loading..." />
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold text-foreground mb-2">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="support@crypxpro.com" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Direct email inquiries will be sent here.</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Telegram</label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="text" value={formData.telegram} onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="https://t.me/username" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="pl-10 w-full border border-border rounded-lg p-2.5 bg-card text-foreground focus:ring-2 focus:ring-ring outline-none" placeholder="https://wa.me/1234567890" />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border flex items-center justify-end gap-4">
              {success && (
                <span className="text-sm text-emerald-600 font-bold flex items-center gap-2">
                  <CheckCircle size={16} /> Saved Successfully
                </span>
              )}
              <button type="submit" disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2.5 px-6 rounded-lg transition-all disabled:opacity-70 flex items-center gap-2">
                {saving && <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
