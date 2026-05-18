<template>
  <div class="admin">
    <header class="page-header">
      <p class="kicker">★ — Admin</p>
      <h2>Registration tokens</h2>
      <p class="sub">Generate tokens to invite new editors. Each token can be used once.</p>
    </header>

    <div class="card">
      <div class="actions">
        <button class="btn" @click="generateToken" :disabled="generating">
          {{ generating ? 'Generating…' : '+ Generate token' }}
        </button>
        <span class="counts">
          {{ unusedCount }} unused / {{ tokens.length }} total
        </span>
      </div>

      <p v-if="msg" class="notice notice--success" style="margin-top: 16px">{{ msg }}</p>

      <div class="token-list" v-if="tokens.length">
        <div v-for="t in tokens" :key="t.id" class="token-row" :class="{ used: t.usedBy }">
          <div class="token-data">
            <code class="token-code">{{ t.id }}</code>
            <div class="token-meta">
              <span v-if="t.usedBy">Used · {{ t.usedByEmail || t.usedBy }}</span>
              <span v-else class="unused-pill">Unused</span>
              <span v-if="t.createdAt">· Created {{ formatDate(t.createdAt) }}</span>
            </div>
          </div>
          <div class="token-actions">
            <button class="btn btn--ghost btn--small" @click="copyToken(t.id)" v-if="!t.usedBy">
              {{ copied === t.id ? 'Copied' : 'Copy' }}
            </button>
            <button class="btn btn--ghost btn--small btn--danger" @click="del(t.id)" v-if="!t.usedBy">
              Delete
            </button>
          </div>
        </div>
      </div>

      <p v-else-if="!loading" class="empty">No tokens yet. Generate one to invite an editor.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  collection, doc, getDocs, getDoc, setDoc, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore'

definePageMeta({ middleware: 'admin', layout: 'dashboard' })
useHead({ title: 'Admin — Dashboard' })

const tokens = ref([])
const loading = ref(true)
const generating = ref(false)
const msg = ref('')
const copied = ref('')

const unusedCount = computed(() => tokens.value.filter(t => !t.usedBy).length)

async function load() {
  loading.value = true
  try {
    const q = query(collection(useDb(), 'tokens'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    tokens.value = await Promise.all(snap.docs.map(async d => {
      const data = { id: d.id, ...d.data() }
      if (data.usedBy) {
        try {
          const u = await getDoc(doc(useDb(), 'users', data.usedBy))
          if (u.exists()) data.usedByEmail = u.data().email
        } catch {}
      }
      return data
    }))
  } finally {
    loading.value = false
  }
}

function randomToken(len = 12) {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

async function generateToken() {
  generating.value = true
  msg.value = ''
  try {
    const tokenId = randomToken()
    await setDoc(doc(useDb(), 'tokens', tokenId), {
      token: tokenId,
      createdAt: serverTimestamp(),
      usedBy: null,
      usedAt: null
    })
    msg.value = `Token generated: ${tokenId}`
    await load()
  } catch (e) {
    alert('Failed: ' + e.message)
  } finally {
    generating.value = false
  }
}

async function copyToken(id) {
  await navigator.clipboard.writeText(id)
  copied.value = id
  setTimeout(() => copied.value = '', 1800)
}

async function del(id) {
  if (!confirm('Delete this token?')) return
  await deleteDoc(doc(useDb(), 'tokens', id))
  await load()
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(load)
</script>

<style scoped>
.admin { display: flex; flex-direction: column; gap: 24px; max-width: 760px; }
.page-header h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  margin: 0;
}
.page-header .sub {
  color: var(--ink-soft);
  margin-top: 6px;
  font-size: 14px;
}
.kicker {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin: 0 0 6px;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.counts {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted);
}

.token-list {
  margin-top: 20px;
  border-top: 1px solid var(--border-soft);
}
.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-soft);
}
.token-row.used { opacity: 0.55; }
.token-code {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 500;
  background: var(--bg);
  padding: 4px 10px;
  border-radius: var(--radius);
  letter-spacing: 0.05em;
}
.token-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--muted);
  margin-top: 6px;
}
.unused-pill {
  background: rgba(122, 79, 58, 0.1);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 10px;
}
.token-actions { display: flex; gap: 6px; }
.empty {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
  margin-top: 20px;
}
</style>
