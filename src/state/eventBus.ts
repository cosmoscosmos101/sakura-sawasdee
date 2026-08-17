/**
 * Typed event bus — the ONLY channel between Phaser and React.
 *
 * Architecture rule (CLAUDE.md §4): src/game/ never imports React and
 * src/ui/ never imports Phaser. They talk through this bus and Zustand stores.
 */

import type { DialogueNode } from "../content/schema";

export type GameEvents = {
  "battle:start": { enemyId: string; locationId: string; bossGimmick?: string; bossMaxHp?: number };
  "battle:end": { won: boolean; xpGained: number };
  /** React emits this so BattleScene can play the matching visual effect. */
  "battle:effect": { type: "damage" | "critical" | "miss" | "combo" | "heal"; amount?: number };
  /** Phaser emits this when the player initiates dialogue with an NPC. */
  "dialogue:open": { npcId: string; nodes: DialogueNode[]; startId: string };
  "dialogue:close": undefined;
  "kotodama:encounter": { kotodamaId: string; isDue: boolean };
  "map:change": { mapId: string };
  "boot:progress": { value: number };
  "boot:complete": undefined;
  /** Tone Kitchen: Phaser emits when player enters Pa Somsri's kitchen zone. */
  "tone_kitchen:open": undefined;
  /** Karaoke: emitted by KaraokeScene when song starts. */
  "karaoke:start": { totalMs: number };
  /** Karaoke: emitted when the song finishes. */
  "karaoke:complete": Record<string, never>;
  /** Karaoke: React or ESC emits to stop the scene. */
  "karaoke:exit": Record<string, never>;
  /** Pier Fishing: Phaser emits when player talks to the fishing NPC. */
  "fishing:open": undefined;
  /** Naga Word Segment puzzle: Phaser emits when player interacts with Naga at the pier. */
  "word_segment:open": { location: string };
  /** Pa Somsri's market bargaining minigame. */
  "bargaining:open": undefined;
  /** Tuk-tuk racing minigame — reading fluency. */
  "tuktuk:open": undefined;
  /** Thai handwriting stroke tracing. */
  "handwriting:open": undefined;
};

export type GameEventName = keyof GameEvents;

type Handler<K extends GameEventName> = (payload: GameEvents[K]) => void;

class EventBus {
  private handlers = new Map<GameEventName, Set<Handler<GameEventName>>>();

  on<K extends GameEventName>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as Handler<GameEventName>);
    return () => this.off(event, handler);
  }

  off<K extends GameEventName>(event: K, handler: Handler<K>): void {
    this.handlers.get(event)?.delete(handler as Handler<GameEventName>);
  }

  emit<K extends GameEventName>(
    event: K,
    ...args: GameEvents[K] extends undefined ? [] : [GameEvents[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    const payload = args[0] as GameEvents[K];
    for (const handler of set) {
      (handler as Handler<K>)(payload);
    }
  }

  /** Remove every listener. Call on teardown to avoid leaks. */
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
