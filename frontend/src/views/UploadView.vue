<template>
  <div class="min-h-[100dvh] bg-paper font-sans text-ink">
    <div class="grid min-h-[100dvh] grid-cols-1 grid-rows-[1fr_auto] lg:grid-cols-12 lg:grid-rows-1">
      <section class="flex flex-col px-6 py-8 lg:col-span-7 lg:px-14 lg:py-12 xl:pl-[max(3.5rem,calc((100vw_-_1400px)/2_+_3.5rem))]">
        <BrandMark />

        <div class="my-auto py-12 lg:py-16">
          <h1 class="rise font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            One video.<br>Your whole wardrobe.
          </h1>
          <p class="mt-5 max-w-[52ch] text-lg text-ink-soft">
            Upload a short clip of your closet. The stylist reads every piece and dresses you for today's weather.
          </p>

          <button
            type="button"
            data-testid="dropzone"
            :data-dragging="isDragging"
            class="mt-10 flex w-full max-w-xl items-start gap-4 border bg-surface px-6 py-7 text-left transition-colors duration-200 hover:bg-paper data-[dragging=true]:border-accent data-[dragging=true]:bg-paper"
            :class="isDragging ? 'border-accent' : 'border-ink'"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <span class="flex h-12 w-12 shrink-0 items-center justify-center bg-accent text-accent-ink">
              <PhUploadSimple :size="26" aria-hidden="true" />
            </span>
            <span class="block">
              <span class="block font-display text-xl font-semibold">Upload Video</span>
              <span class="block text-ink-soft">or drag and drop</span>
              <span class="mt-3 block font-mono text-xs text-ink-soft">MP4, MOV up to 50MB</span>
            </span>
          </button>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            class="sr-only"
            accept="video/*"
            tabindex="-1"
            aria-label="Choose a video file"
            @click.stop
            @change="handleFileSelect"
            ref="fileInput"
          >

          <p
            v-if="store.error"
            role="alert"
            class="mt-4 max-w-xl border border-accent bg-surface px-4 py-3 text-sm"
          >
            {{ store.error }}
          </p>

          <div
            v-if="selectedFile && !store.loading"
            class="mt-4 flex max-w-xl flex-col justify-between gap-3 border border-line bg-surface p-4 sm:flex-row sm:items-center"
          >
            <span class="truncate font-mono text-sm" data-testid="file-name">{{ selectedFile.name }}</span>
            <button
              type="button"
              class="h-11 shrink-0 bg-accent px-6 font-medium text-accent-ink transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px"
              @click.stop="analyzeVideo"
            >
              {{ store.inventory.length > 0 ? 'Add to Wardrobe' : 'Analyze Wardrobe' }}
            </button>
          </div>

          <div v-if="store.inventory.length > 0 && !selectedFile" class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              class="inline-flex h-11 items-center gap-2 border border-ink px-5 font-medium transition-colors duration-200 hover:bg-ink hover:text-paper active:translate-y-px"
              @click="router.push('/wardrobe')"
            >
              <span>Continue with {{ store.inventory.length }} items</span>
              <PhArrowRight :size="18" aria-hidden="true" />
            </button>
            <div v-if="confirmingReset" class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span>Delete your wardrobe?</span>
              <button type="button" class="font-medium underline underline-offset-4" @click="resetWardrobe">Yes, delete</button>
              <button type="button" class="text-ink-soft underline underline-offset-4 hover:text-ink" @click="confirmingReset = false">Cancel</button>
            </div>
            <button
              v-else
              type="button"
              class="text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
              @click="confirmingReset = true"
            >
              Reset / Clear Data
            </button>
          </div>
        </div>
      </section>

      <aside
        class="relative flex h-56 border-t border-line lg:col-span-5 lg:h-auto lg:border-l lg:border-t-0"
        aria-hidden="true"
      >
        <div class="flex w-full flex-row lg:flex-col">
          <div
            v-for="(swatch, index) in swatches"
            :key="swatch.color"
            class="unfurl relative min-h-0 min-w-0"
            :style="{ backgroundColor: swatch.color, flexGrow: swatchWeights[index % swatchWeights.length], '--i': index + 2 }"
          >
            <span class="absolute bottom-2 left-2 hidden max-w-[calc(100%-1rem)] truncate bg-paper px-2 py-1 font-mono text-xs text-ink lg:block">
              {{ swatch.label }}
            </span>
          </div>
        </div>
        <span class="absolute left-0 top-0 bg-ink px-3 py-1.5 text-xs font-medium text-paper">
          {{ store.inventory.length > 0 ? 'Your colors' : 'Sample colors' }}
        </span>
      </aside>
    </div>

    <div
      v-if="store.loading"
      class="fixed inset-0 z-50 flex flex-col bg-paper lg:flex-row"
      role="status"
      aria-live="polite"
    >
      <div class="relative h-[45dvh] overflow-hidden bg-screen lg:h-auto lg:flex-1">
        <video
          v-if="videoPreviewUrl"
          :src="videoPreviewUrl"
          autoplay
          loop
          muted
          playsinline
          class="h-full w-full object-cover opacity-80"
        ></video>
        <div class="scan-line pointer-events-none absolute inset-0 border-b-2 border-accent" aria-hidden="true"></div>
      </div>

      <div class="flex flex-1 flex-col justify-center gap-6 px-6 py-10 lg:px-14">
        <h3 class="font-display text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
          {{ currentStatusMessage }}
        </h3>
        <div class="h-1 w-full max-w-md bg-line">
          <div
            class="h-full origin-left bg-accent transition-transform duration-300 ease-out"
            :style="{ transform: `scaleX(${progress / 100})` }"
          ></div>
        </div>
        <p class="font-mono text-sm text-ink-soft">{{ Math.round(progress) }}% complete</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhUploadSimple, PhArrowRight } from '@phosphor-icons/vue'
import BrandMark from '../components/BrandMark.vue'
import { useWardrobeStore } from '../stores/wardrobe'
import { getValidColor, getColorName } from '../utils/color'

const router = useRouter()
const store = useWardrobeStore()
const fileInput = ref(null)
const selectedFile = ref(null)
const isDragging = ref(false)
const confirmingReset = ref(false)

store.loadState();
store.getUserLocation();

const videoPreviewUrl = ref(null)
const progress = ref(0)
const currentStatusMessage = ref("Initializing...")
let progressInterval = null

const SAMPLE_COLORS = ['#1e2a44', '#6b7a4f', '#b5532f', '#7f9bb5', '#d9d4c7', '#2a2a2c']
const swatchWeights = [3, 2, 4, 2, 3, 2, 4, 3]
const MAX_SWATCHES = 8

const swatches = computed(() => {
  const seen = new Set()
  const colors = []
  for (const item of store.inventory) {
    const color = getValidColor(item.primary_color)
    const key = color.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    colors.push({ color, label: getColorName(item.primary_color) })
    if (colors.length === MAX_SWATCHES) break
  }
  return colors.length > 0 ? colors : SAMPLE_COLORS.map((color) => ({ color, label: color }))
})

const resetWardrobe = () => {
  store.clearWardrobe()
  confirmingReset.value = false
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  if (event.target.files.length > 0) {
    setFile(event.target.files[0])
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  if (event.dataTransfer.files.length > 0) {
    setFile(event.dataTransfer.files[0])
  }
}

const setFile = (file) => {
    selectedFile.value = file
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
    videoPreviewUrl.value = URL.createObjectURL(file)
}

const startFakeProgress = () => {
    progress.value = 0
    currentStatusMessage.value = "Initializing..."

    if (progressInterval) clearInterval(progressInterval)

    progressInterval = setInterval(() => {
        if (progress.value < 90) {
            const increment = Math.random() * 0.5 + 0.1
            progress.value = Math.min(progress.value + increment, 90)

            if (progress.value > 15 && progress.value < 40) currentStatusMessage.value = "Reading colors..."
            if (progress.value >= 40 && progress.value < 65) currentStatusMessage.value = "Sorting by type and season..."
            if (progress.value >= 65 && progress.value < 85) currentStatusMessage.value = "Identifying clothing items..."
            if (progress.value >= 85) currentStatusMessage.value = "Rating formality..."
        }
    }, 100)
}

const analyzeVideo = async () => {
    if (!selectedFile.value) return;

    startFakeProgress()

    try {
        await store.analyzeVideo(selectedFile.value);
        if (!store.error) {
            progress.value = 100
            currentStatusMessage.value = "Complete!"
            setTimeout(() => {
                router.push('/wardrobe');
            }, 500)
        } else {
            clearInterval(progressInterval)
        }
    } catch (e) {
        clearInterval(progressInterval)
        currentStatusMessage.value = "Error occurred."
    }
}

onUnmounted(() => {
    if (progressInterval) clearInterval(progressInterval)
    if (videoPreviewUrl.value) URL.revokeObjectURL(videoPreviewUrl.value)
})
</script>
