import React, { useState, useRef } from 'react';
import { Loader2, Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ModalOverlay, ModalHeader, FormLabel, inputCls, btnPrimary, btnSecondary } from '../ui';
import { useCreateNewsMutation } from '../../hooks/useCommunication';
import { communicationService } from '../../services/communicationService';
import { useAuth } from '../../store/AuthContext';

export function AddNewsModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const createNewsMutation = useCreateNewsMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [useUrlMode, setUseUrlMode] = useState(false);
  const [imageUrlText, setImageUrlText] = useState('');

  const [newNews, setNewNews] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Comunicado' as 'Comunicado' | 'Preço' | 'Evento' | 'Informativo',
    targetAudience: 'todos' as 'todos' | 'cooperados' | 'terceiros',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('A imagem selecionada é muito grande (máximo 10MB).');
        return;
      }
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setImageUrlText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title.trim() || !newNews.content.trim()) {
      toast.error('Preencha os campos obrigatórios (Título e Conteúdo).');
      return;
    }

    let finalImageUrl: string | undefined = undefined;

    if (useUrlMode && imageUrlText.trim()) {
      finalImageUrl = imageUrlText.trim();
    } else if (selectedFile) {
      setIsUploadingImage(true);
      try {
        finalImageUrl = await communicationService.uploadNewsImage(selectedFile);
      } catch (err: any) {
        toast.error('Erro ao processar imagem: ' + (err?.message || 'Tente novamente'));
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    createNewsMutation.mutate(
      {
        input: {
          title: newNews.title.trim(),
          summary: newNews.summary.trim() || undefined,
          content: newNews.content.trim(),
          category: newNews.category,
          targetAudience: newNews.targetAudience,
          imageUrl: finalImageUrl,
          published: true,
        },
        adminId: user?.id,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const isBusy = createNewsMutation.isPending || isUploadingImage;

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Publicar Notícia / Comunicado" onClose={onClose} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[85vh] overflow-y-auto">
        <div>
          <FormLabel>Título da Notícia *</FormLabel>
          <input
            type="text"
            value={newNews.title}
            onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
            className={inputCls}
            placeholder="Ex: Atualização da Escala de Abate no Feriado"
            required
            disabled={isBusy}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <FormLabel>Categoria</FormLabel>
            <select
              value={newNews.category}
              onChange={(e) => setNewNews({ ...newNews, category: e.target.value as any })}
              className={inputCls}
              disabled={isBusy}
            >
              <option value="Comunicado">Comunicado Oficial</option>
              <option value="Preço">Aviso de Preço & Mercado</option>
              <option value="Evento">Cooperativa & Eventos</option>
              <option value="Informativo">Informativo & Legislação</option>
            </select>
          </div>
          <div>
            <FormLabel>Público Alvo</FormLabel>
            <select
              value={newNews.targetAudience}
              onChange={(e) => setNewNews({ ...newNews, targetAudience: e.target.value as any })}
              className={inputCls}
              disabled={isBusy}
            >
              <option value="todos">Todos (Cooperados e Terceiros)</option>
              <option value="cooperados">Apenas Cooperados</option>
              <option value="terceiros">Apenas Terceiros</option>
            </select>
          </div>
        </div>

        {/* Seção de Imagem / Foto */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <FormLabel>Imagem de Capa (Opcional)</FormLabel>
            <button
              type="button"
              onClick={() => setUseUrlMode(!useUrlMode)}
              className="text-[11px] text-[#c51d1f] hover:underline font-medium flex items-center gap-1"
            >
              {useUrlMode ? <Upload className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
              {useUrlMode ? 'Enviar arquivo do computador' : 'Inserir link de imagem'}
            </button>
          </div>

          {useUrlMode ? (
            <div className="space-y-2">
              <input
                type="url"
                value={imageUrlText}
                onChange={(e) => {
                  setImageUrlText(e.target.value);
                  setImagePreview(e.target.value || null);
                }}
                className={inputCls}
                placeholder="https://exemplo.com/foto-noticia.jpg"
                disabled={isBusy}
              />
              {imagePreview && (
                <div className="relative w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => toast.error('Não foi possível carregar a imagem deste link')}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full transition-colors"
                    title="Remover imagem"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isBusy}
              />

              {imagePreview ? (
                <div className="relative w-full h-40 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition-all"
                    >
                      Trocar Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition-all"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-[#c51d1f] hover:bg-red-50/20 rounded-xl p-5 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-500 hover:text-[#c51d1f]"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-xs font-semibold">Clique para selecionar uma foto ou imagem</span>
                  <span className="text-[11px] text-slate-400">Formatos aceitos: JPG, PNG, WEBP (até 10MB)</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div>
          <FormLabel>Conteúdo do Comunicado / Notícia *</FormLabel>
          <textarea
            rows={4}
            value={newNews.content}
            onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
            className={inputCls + ' resize-none'}
            placeholder="Digite o texto completo que aparecerá no feed de notícias do aplicativo..."
            required
            disabled={isBusy}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className={btnSecondary}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className={btnPrimary + ' flex items-center gap-1.5'}
          >
            {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {isUploadingImage
                ? 'Processando Imagem...'
                : createNewsMutation.isPending
                ? 'Publicando...'
                : 'Publicar Notícia'}
            </span>
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

