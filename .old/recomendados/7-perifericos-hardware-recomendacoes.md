# Recomendacoes de Perifericos e Hardware — JARVIS

## 1. Acesso a Microfone

### Stack Recomendada

| Tecnologia | Funcao | Gratis? | Plataforma |
|-----------|--------|---------|-----------|
| Web Audio API (navegador) | Captura de audio basica | ✅ Sim | Web |
| cpal (Rust) | Captura de audio nativa | ✅ Sim | Desktop |
| pyaudio (Python) | Captura de audio | ✅ Sim | Cross |
| whisper (Python) | Speech-to-Text (transcricao) | ✅ Sim | Cross |
| edge-tts (Python) | Text-to-Speech (voz) | ✅ Sim | Cross |

### Fluxo de Captura de Audio

```
[Usuario clica microfone]
    → Frontend: indica "Ouvindo..." com animacao pulse
    → Rust: inicia captura via cpal (ou Python via sidecar)
    → Buffer de audio em memoria (circular, max 30s)
    → [Usuario para de falar] OU [Timeout 5s silencio]
    → Audio enviado para Python Sidecar
    → Python: whisper transcreve
    → Frontend: texto aparece no chat
    → Frontend: processa resposta normalmente
    → Se TTS ativo: resposta vai para edge-tts
    → Python: gera audio MP3
    → Rust: reproduz audio no sistema
```

### Interface de Voz

```tsx
<VoiceButton
  isListening={isListening}
  onToggle={toggleListening}
  visualFeedback="pulse"     // Animacao de pulso quando ouvindo
  showWaveform={true}         // Visualizacao de onda de audio
  autoSend={true}             // Envia automaticamente quando parar de falar
  language="pt-BR"            // Idioma para STT
/>
```

### VAD (Voice Activity Detection)

```python
# sidecar/core/vad.py
import webrtcvad
import collections

class VoiceActivityDetector:
    def __init__(self, mode=2):  # 0-3, mais alto = mais agressivo
        self.vad = webrtcvad.Vad(mode)
        self.ring_buffer = collections.deque(maxlen=30)  # 30 frames
        self.triggered = False
        
    def process_frame(self, frame: bytes, sample_rate: int = 16000):
        is_speech = self.vad.is_speech(frame, sample_rate)
        self.ring_buffer.append(is_speech)
        
        # Deteccao: precisa de X frames consecutivos de voz/silencio
        num_voiced = sum(self.ring_buffer)
        
        if not self.triggered:
            if num_voiced > 0.8 * len(self.ring_buffer):
                self.triggered = True
                return "start"
        else:
            if num_voiced < 0.2 * len(self.ring_buffer):
                self.triggered = False
                return "end"
        
        return "continue" if self.triggered else "silence"
```

---

## 2. Acesso a Webcam

### Stack Recomendada

| Tecnologia | Funcao | Gratis? |
|-----------|--------|---------|
| opencv-python (Python) | Captura e processamento de video | ✅ Sim |
| pillow (Python) | Manipulacao de imagem | ✅ Sim |
| tauri-plugin-dialog | Permissao nativa | ✅ Sim |

### Fluxo de Captura de Webcam

```
[Agente solicita acesso a webcam]
    → Frontend: mostra banner "Agente X quer acessar sua webcam"
    → Usuario autoriza (com expiracao: 30s)
    → Rust: captura frame via comando Tauri
    → OU Python: captura via OpenCV
    → Frame enviado para analise:
        ├── Modelo multimodal (Llama 3.2 Vision) para entender cena
        └── Processamento OpenCV se necessario (QR code, texto)
    → Resultado retorna ao agente
    → Frame descartado imediatamente
    → Auditoria registra: webcam, timestamp, duracao
```

### Interface de Webcam

```tsx
<WebcamPermissionBanner>
  <Camera size={20} />
  <span>O agente "{agentName}" quer acessar sua webcam para: {reason}</span>
  <div class="webcam-preview">
    {/* Mini preview do que a camera esta vendo */}
    <video ref={previewRef} width={160} height={120} />
  </div>
  <div class="webcam-timer">
    Expira em: {remainingSeconds}s
  </div>
  <button onClick={grant}>Permitir</button>
  <button onClick={deny}>Negar</button>
</WebcamPermissionBanner>
```

---

## 3. Notificacoes Desktop

### Stack

| Tecnologia | Funcao |
|-----------|--------|
| Tauri Notification Plugin | Notificacoes nativas do SO |
| react-hot-toast | Notificacoes in-app |

### Implementacao

```typescript
// infrastructure/notifications.ts
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export async function sendDesktopNotification(title: string, body: string, icon?: string) {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === 'granted';
  }
  
  if (granted) {
    sendNotification({ title, body, icon });
  }
}

// Tipos de notificacao
export type NotificationType = 
  | 'agent-complete'     // Agente terminou tarefa
  | 'permission-needed'  // Solicitacao de permissao
  | 'automation-done'    // Automacao concluida
  | 'error'              // Erro critico
  | 'update-available'   // Nova versao
  | 'voice-ready'        // Voz ativa/pronta
  | 'finance-alert'      // Alerta financeiro
;
```

---

## 4. Area de Transferencia (Clipboard)

### Stack

| Tecnologia | Funcao |
|-----------|--------|
| Tauri clipboard plugin | Ler/escrever clipboard nativo |
| arboard (Rust) | Clipboard multiplataforma |

### Regras

- **Leitura**: requer permissao `clipboard-read` (risco medio)
- **Escrita**: requer permissao `clipboard-write` (risco baixo)
- **Auditoria**: registrar quando agente le o clipboard
- **Nunca** enviar clipboard para modelos sem permissao explicita

---

## 5. Tabela de Permissoes de Hardware

| Periferico | Permissao | Risco | STT/TTS Integrado? |
|-----------|-----------|-------|-------------------|
| Microfone (entrada) | microphone | 🟡 Medio | STT: whisper |
| Alto-falante (saida) | — | 🟢 Baixo | TTS: edge-tts |
| Webcam (video) | webcam | 🔴 Alto | Analise: Llama Vision |
| Tela (captura) | screen-capture | 🔴 Critico | OCR: tesseract |
| Teclado (simular) | keyboard-mouse | 🔴 Alto | — |
| Mouse (simular) | keyboard-mouse | 🔴 Alto | — |
| Clipboard (ler) | clipboard-read | 🟡 Medio | — |
| Clipboard (escrever) | clipboard-write | 🟢 Baixo | — |
| Notificacoes | notifications | 🟢 Baixo | — |
| Arquivos (download) | file-download | 🟡 Medio | — |

---

## 6. Configuracao de Perifericos no Settings

```
┌──────────────────────────────────────────────────────────────┐
│  🌐 Perifericos                                               │
│                                                              │
│  🎤 Microfone                                                 │
│    Dispositivo: [Microfone Array (Realtek) ▼]                │
│    [x] Ativar entrada de voz                                  │
│    [x] Envio automatico ao parar de falar                     │
│    Idioma padrao: [Português (Brasil) ▼]                     │
│    [Testar microfone]                                         │
│                                                              │
│  🔊 Audio                                                     │
│    Saida de voz: [✅ Ativada]                                 │
│    Voz padrao: [pt-BR-AntonioNeural ▼]                       │
│    Velocidade: [████████░░] 80%                               │
│    Volume: [██████████] 100%                                  │
│    [Testar voz]                                               │
│                                                              │
│  📷 Webcam                                                    │
│    Dispositivo: [HD Webcam C270 ▼]                           │
│    [x] Permitir captura quando solicitado                     │
│    Resolucao maxima: [640x480 ▼]                             │
│    [Testar webcam]                                            │
│                                                              │
│  🔒 Seguranca dos Perifericos                                 │
│    Tempo de expiracao de permissao: [30 segundos ▼]          │
│    [x] Mostrar preview antes de permitir webcam               │
│    [x] Indicador visual quando microfone estiver ativo        │
│    [x] Registrar todas as capturas em auditoria               │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Consideracoes de Privacidade

1. **Indicadores visuais**: SEMPRE mostrar quando microfone/webcam estiver ativo
2. **Dados efemeros**: audio/video descartados apos processamento
3. **Preview**: usuario ve o que a webcam esta capturando antes de autorizar
4. **Timeouts**: permissoes de hardware expiram automaticamente
5. **Auditoria**: toda captura e registrada com timestamp e duracao
6. **Opt-in total**: nada e capturado sem permissao explicita
7. **Processamento local**: STT/TTS rodam localmente (whisper, edge-tts)
