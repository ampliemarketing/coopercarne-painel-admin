import { useState } from 'react';
import { Plus, RefreshCw, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { PageHeader, Badge, btnPrimary } from '../../components/ui';
import { AddNewsModal } from '../../components/modals/AddNewsModal';
import {
  useNewsQuery,
  useToggleNewsPublishedMutation,
  useDeleteNewsMutation,
} from '../../hooks/useCommunication';

export function NewsPage() {
  const { data: news = [], isLoading, isError, error, refetch, isFetching } = useNewsQuery();
  const togglePublishedMutation = useToggleNewsPublishedMutation();
  const deleteNewsMutation = useDeleteNewsMutation();

  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);

  const getBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'Preço':
        return 'green';
      case 'Evento':
        return 'purple';
      case 'Informativo':
        return 'amber';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <PageHeader
          title="Notícias & Comunicados"
          description="Publicação em tempo real de comunicados, avisos de preços e regras de abate no App dos cooperados"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors shadow-sm disabled:opacity-50"
            title="Atualizar notícias"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#c51d1f]' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddNewsOpen(true)}
            className={btnPrimary + ' flex items-center gap-1.5 text-xs'}
          >
            <Plus className="w-4 h-4" /> Publicar Comunicado
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-40 bg-white border border-slate-200 rounded-md" />
          <div className="h-40 bg-white border border-slate-200 rounded-md" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Erro ao carregar notícias</h3>
          <p className="text-xs text-red-700 mb-4">{error?.message}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-md p-4 shadow-sm transition-all ${
                item.published ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(item.category)}>{item.category}</Badge>
                  {!item.published && (
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Rascunho
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-medium">{item.date}</span>
              </div>
              {item.imageUrl && (
                <div className="w-full h-36 bg-slate-100 rounded overflow-hidden mb-3 -mt-1">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-3 mb-3">{item.content}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                <div>
                  Público:{' '}
                  <span className="text-slate-700 font-bold capitalize">{item.targetAudience}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      togglePublishedMutation.mutate({
                        id: item.id,
                        published: !item.published,
                      })
                    }
                    className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                    title={item.published ? 'Alterar para Rascunho' : 'Publicar'}
                  >
                    {item.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o comunicado "${item.title}"?`)) {
                        deleteNewsMutation.mutate(item.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Excluir Notícia"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {news.length === 0 && (
            <div className="col-span-2 bg-white border border-slate-200 rounded-md p-10 text-center text-slate-400 text-xs">
              Nenhuma notícia ou comunicado publicado no momento.
            </div>
          )}
        </div>
      )}

      {isAddNewsOpen && <AddNewsModal onClose={() => setIsAddNewsOpen(false)} />}
    </div>
  );
}
