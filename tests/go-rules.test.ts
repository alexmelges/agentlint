import { describe, it, expect } from 'vitest';
import { goErrorIgnored } from '../src/rules/go-error-ignored.js';
import { goDeferInLoop } from '../src/rules/go-defer-in-loop.js';
import { goGoroutineLeak } from '../src/rules/go-goroutine-leak.js';
import { goNilCheckMissing } from '../src/rules/go-nil-check-missing.js';
import { goBareReturn } from '../src/rules/go-bare-return.js';
import { goInitFunction } from '../src/rules/go-init-function.js';

function check(rule: any, content: string, file = 'main.go') {
  return rule.check(file, content, content.split('\n'));
}

// ── go-error-ignored ──────────────────────────────────────────────

describe('go-error-ignored', () => {
  it('detects blank identifier discarding error', () => {
    const code = `val, _ := strconv.Atoi(input)`;
    const v = check(goErrorIgnored, code);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('go-error-ignored');
    expect(v[0].message).toContain('blank identifier');
  });

  it('detects error ignored with assignment', () => {
    const code = `result, _ = json.Marshal(data)`;
    const v = check(goErrorIgnored, code);
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes when error is captured', () => {
    const code = `val, err := strconv.Atoi(input)
if err != nil {
    return err
}`;
    const v = check(goErrorIgnored, code);
    // Should not flag blank identifier since err is used
    expect(v.filter((v: any) => v.message.includes('blank identifier'))).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `val, _ := strconv.Atoi(input)`;
    const v = check(goErrorIgnored, code, 'main_test.go');
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// val, _ := strconv.Atoi(input)`;
    const v = check(goErrorIgnored, code);
    expect(v).toHaveLength(0);
  });
});

// ── go-defer-in-loop ──────────────────────────────────────────────

describe('go-defer-in-loop', () => {
  it('detects defer inside for loop', () => {
    const code = `for _, f := range files {
    file, err := os.Open(f)
    defer file.Close()
}`;
    const v = check(goDeferInLoop, code);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('go-defer-in-loop');
    expect(v[0].message).toContain('defer inside for loop');
  });

  it('passes defer outside loop', () => {
    const code = `file, err := os.Open(name)
defer file.Close()
for _, line := range lines {
    process(line)
}`;
    const v = check(goDeferInLoop, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `for i := 0; i < 10; i++ {
    defer cleanup()
}`;
    const v = check(goDeferInLoop, code, 'main_test.go');
    expect(v).toHaveLength(0);
  });
});

// ── go-goroutine-leak ─────────────────────────────────────────────

describe('go-goroutine-leak', () => {
  it('detects goroutine without sync', () => {
    const code = `func handler() {
    go processRequest(data)
}`;
    const v = check(goGoroutineLeak, code);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('go-goroutine-leak');
  });

  it('detects go func() without sync', () => {
    const code = `func main() {
    go func() {
        doWork()
    }()
}`;
    const v = check(goGoroutineLeak, code);
    expect(v.length).toBeGreaterThan(0);
  });

  it('passes with WaitGroup', () => {
    const code = `func handler() {
    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        processRequest(data)
    }()
    wg.Wait()
}`;
    const v = check(goGoroutineLeak, code);
    expect(v).toHaveLength(0);
  });

  it('passes with context cancellation', () => {
    const code = `func handler() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    go processRequest(ctx, data)
}`;
    const v = check(goGoroutineLeak, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `go processRequest(data)`;
    const v = check(goGoroutineLeak, code, 'main_test.go');
    expect(v).toHaveLength(0);
  });
});

// ── go-nil-check-missing ──────────────────────────────────────────

describe('go-nil-check-missing', () => {
  it('detects using result before checking err', () => {
    const code = `result, err := getUser(id)
result.Name = "test"`;
    const v = check(goNilCheckMissing, code);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('go-nil-check-missing');
    expect(v[0].message).toContain('result');
  });

  it('passes when err is checked first', () => {
    const code = `result, err := getUser(id)
if err != nil {
    return nil, err
}
result.Name = "test"`;
    const v = check(goNilCheckMissing, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `result, err := getUser(id)
result.Name = "test"`;
    const v = check(goNilCheckMissing, code, 'main_test.go');
    expect(v).toHaveLength(0);
  });
});

// ── go-bare-return ────────────────────────────────────────────────

describe('go-bare-return', () => {
  it('detects naked return in named return func', () => {
    const code = `func divide(a, b int) (result int, err error) {
    if b == 0 {
        err = errors.New("division by zero")
        return
    }
    result = a / b
    return
}`;
    const v = check(goBareReturn, code);
    expect(v.length).toBeGreaterThan(0);
    expect(v[0].rule).toBe('go-bare-return');
    expect(v[0].message).toContain('Naked return');
  });

  it('passes with explicit return values', () => {
    const code = `func divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}`;
    const v = check(goBareReturn, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `func helper() (result int, err error) {
    return
}`;
    const v = check(goBareReturn, code, 'main_test.go');
    expect(v).toHaveLength(0);
  });
});

// ── go-init-function ──────────────────────────────────────────────

describe('go-init-function', () => {
  it('detects init() function', () => {
    const code = `func init() {
    db = connectDB()
    loadConfig()
}`;
    const v = check(goInitFunction, code);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('go-init-function');
    expect(v[0].message).toContain('init()');
  });

  it('passes regular functions', () => {
    const code = `func initialize() {
    db = connectDB()
}`;
    const v = check(goInitFunction, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// func init() {`;
    const v = check(goInitFunction, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files', () => {
    const code = `func init() {
    setupTest()
}`;
    const v = check(goInitFunction, code, 'setup_test.go');
    expect(v).toHaveLength(0);
  });
});
