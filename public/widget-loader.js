/**
 * LinkMágico Widget Loader v7.0 (Focado na Correção)
 * 
 * Este script é o ponto de entrada para carregar o widget do LinkMágico
 * em qualquer site de cliente. Ele resolve os problemas de CORS,
 * caminhos relativos e carregamento de dependências, sem alterar a lógica
 * interna do servidor.
 * 
 * Uso:
 * <script src="https://seu-dominio.com/public/widget-loader.js?apiKey=SEU_API_KEY"></script>
 */

(function(window, document) {
    'use strict';

    // Detectar o domínio do servidor LinkMágico a partir do script loader
    const scripts = document.querySelectorAll('script[src*="widget-loader.js"]');
    const loaderScript = scripts[scripts.length - 1];
    const loaderSrc = loaderScript.src;
    
    // Extrair domínio base (ex: https://linkmagico-comercial.onrender.com)
    const urlObj = new URL(loaderSrc);
    const LINKMAGICO_BASE = urlObj.origin; 
    const API_KEY = urlObj.searchParams.get('apiKey') || '';
    
    // Prevenir múltiplas inicializações
    if (window.LinkMagicoWidgetLoaded) {
        return;
    }

    window.LinkMagicoWidgetLoaded = true;

    /**
     * Carregar um arquivo CSS de forma segura
     */
    function loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    /**
     * Carregar um arquivo JavaScript de forma segura
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Inicializar o widget
     */
    async function initializeWidget() {
        try {
            // 1. Carregar Font Awesome (ícones) - Necessário para o balão flutuante
            await loadCSS('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');

            // 2. Carregar o widget principal (mantendo o nome original 'widjet.js' ou 'widget.js')
            // No seu projeto, o arquivo é 'widjet.js' (com typo) ou 'widget.js'. Usaremos 'widjet.js'
            // para compatibilidade com o que foi analisado.
            // IMPORTANTE: O widjet.js espera um parâmetro 'token' na URL, não 'apiKey'
            const widgetUrl = `${LINKMAGICO_BASE}/public/widget.js?token=${API_KEY}`;
            await loadScript(widgetUrl);

            // 3. Aguardar o widget estar disponível
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos de espera

            while (!window.LinkMagicoWidget && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!window.LinkMagicoWidget) {
                throw new Error('Widget não foi carregado corretamente');
            }

            // 4. Buscar e configurar o widget
            let userConfig = {};

            if (window.LinkMagicoWidgetConfig) {
                userConfig = {
                    ...window.LinkMagicoWidgetConfig
                };
            }

            // Adicionar API Key e domínio base
            userConfig.apiKey = API_KEY;
            userConfig.apiBase = LINKMAGICO_BASE;

            // 5. Inicializar o widget com a configuração
            window.LinkMagicoWidget.init(userConfig);

            // Disparar evento customizado (opcional, mas bom para integração)
            const event = new CustomEvent('LinkMagicoWidgetReady', {
                detail: { widget: window.LinkMagicoWidget, config: userConfig }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('[LinkMágico Widget] Erro ao inicializar:', error);
            
            // Disparar evento de erro
            const event = new CustomEvent('LinkMagicoWidgetError', {
                detail: { error: error.message }
            });
            document.dispatchEvent(event);
        }
    }

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidget);
    } else {
        initializeWidget();
    }

    // Expor função para reinicializar manualmente (opcional)
    window.LinkMagicoWidgetReload = function(newConfig) {
        if (window.LinkMagicoWidget && window.LinkMagicoWidget.destroy) {
            window.LinkMagicoWidget.destroy();
        }
        if (newConfig) {
            window.LinkMagicoWidgetConfig = newConfig;
        }
        initializeWidget();
    };

})(window, document);
