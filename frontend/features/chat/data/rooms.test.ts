/**
 * ルームデータユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';
import { MOCK_ROOMS, getRoomById, isValidRoomId } from './rooms';

describe('rooms data', () => {
  describe('MOCK_ROOMS', () => {
    it('3つのモックルームが定義されている', () => {
      expect(MOCK_ROOMS).toHaveLength(3);
    });

    it('各ルームに id と name が存在する', () => {
      MOCK_ROOMS.forEach((room) => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
        expect(typeof room.id).toBe('number');
        expect(typeof room.name).toBe('string');
      });
    });

    it('general, random, development ルームが含まれる', () => {
      const names = MOCK_ROOMS.map((room) => room.name);
      expect(names).toContain('general');
      expect(names).toContain('random');
      expect(names).toContain('development');
    });
  });

  describe('getRoomById', () => {
    it('存在するルームIDで正しいルームを返す', () => {
      const room = getRoomById(1);
      expect(room).toBeDefined();
      expect(room?.id).toBe(1);
      expect(room?.name).toBe('general');
    });

    it('存在しないルームIDで undefined を返す', () => {
      const room = getRoomById(999);
      expect(room).toBeUndefined();
    });

    it('各モックルームを正しく取得できる', () => {
      expect(getRoomById(1)?.name).toBe('general');
      expect(getRoomById(2)?.name).toBe('random');
      expect(getRoomById(3)?.name).toBe('development');
    });
  });

  describe('isValidRoomId', () => {
    it('存在するルームIDで true を返す', () => {
      expect(isValidRoomId(1)).toBe(true);
      expect(isValidRoomId(2)).toBe(true);
      expect(isValidRoomId(3)).toBe(true);
    });

    it('存在しないルームIDで false を返す', () => {
      expect(isValidRoomId(0)).toBe(false);
      expect(isValidRoomId(999)).toBe(false);
      expect(isValidRoomId(-1)).toBe(false);
    });
  });
});
