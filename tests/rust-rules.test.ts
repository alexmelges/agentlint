import { describe, it, expect } from 'vitest';
import { rustUnwrap } from '../src/rules/rust-unwrap.js';
import { rustUnsafeBlock } from '../src/rules/rust-unsafe-block.js';
import { rustCloneHeavy } from '../src/rules/rust-clone-heavy.js';
import { rustTodoMacro } from '../src/rules/rust-todo-macro.js';
import { rustPanic } from '../src/rules/rust-panic.js';

function check(rule: any, content: string, file = 'lib.rs') {
  return rule.check(file, content, content.split('\n'));
}

// ── rust-unwrap ───────────────────────────────────────────────────

describe('rust-unwrap', () => {
  it('detects .unwrap() call', () => {
    const code = `let value = some_result.unwrap();`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('rust-unwrap');
    expect(v[0].message).toContain('.unwrap()');
  });

  it('detects multiple .unwrap() calls', () => {
    const code = `let a = x.unwrap();
let b = y.unwrap();`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(2);
  });

  it('skips test files with #[cfg(test)]', () => {
    const code = `#[cfg(test)]
mod tests {
    let value = some_result.unwrap();
}`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(0);
  });

  it('skips test files with #[test]', () => {
    const code = `#[test]
fn it_works() {
    let value = result.unwrap();
}`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// result.unwrap()`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(0);
  });

  it('passes clean code with ?', () => {
    const code = `let value = some_result?;`;
    const v = check(rustUnwrap, code);
    expect(v).toHaveLength(0);
  });
});

// ── rust-unsafe-block ─────────────────────────────────────────────

describe('rust-unsafe-block', () => {
  it('detects unsafe block without SAFETY comment', () => {
    const code = `fn do_stuff() {
    unsafe {
        ptr::write(dest, value);
    }
}`;
    const v = check(rustUnsafeBlock, code);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('rust-unsafe-block');
    expect(v[0].message).toContain('SAFETY');
  });

  it('passes unsafe block with SAFETY comment', () => {
    const code = `fn do_stuff() {
    // SAFETY: dest is guaranteed to be valid and aligned
    unsafe {
        ptr::write(dest, value);
    }
}`;
    const v = check(rustUnsafeBlock, code);
    expect(v).toHaveLength(0);
  });

  it('passes unsafe block with lowercase safety comment', () => {
    const code = `fn do_stuff() {
    // Safety: pointer is valid
    unsafe {
        ptr::write(dest, value);
    }
}`;
    const v = check(rustUnsafeBlock, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// unsafe { do_stuff(); }`;
    const v = check(rustUnsafeBlock, code);
    expect(v).toHaveLength(0);
  });
});

// ── rust-clone-heavy ──────────────────────────────────────────────

describe('rust-clone-heavy', () => {
  it('detects excessive clone calls (5+)', () => {
    const code = `fn process(data: &Data) {
    let a = data.field1.clone();
    let b = data.field2.clone();
    let c = data.field3.clone();
    let d = data.field4.clone();
    let e = data.field5.clone();
}`;
    const v = check(rustCloneHeavy, code);
    expect(v.length).toBe(5);
    expect(v[0].rule).toBe('rust-clone-heavy');
    expect(v[0].message).toContain('Excessive .clone()');
  });

  it('passes with fewer than threshold clones', () => {
    const code = `fn process(data: &Data) {
    let a = data.field1.clone();
    let b = data.field2.clone();
}`;
    const v = check(rustCloneHeavy, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// data.clone()
// data.clone()
// data.clone()
// data.clone()
// data.clone()`;
    const v = check(rustCloneHeavy, code);
    expect(v).toHaveLength(0);
  });
});

// ── rust-todo-macro ───────────────────────────────────────────────

describe('rust-todo-macro', () => {
  it('detects todo!() macro', () => {
    const code = `fn process() -> Result<()> {
    todo!("implement this")
}`;
    const v = check(rustTodoMacro, code);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('rust-todo-macro');
    expect(v[0].message).toContain('todo!()');
  });

  it('detects unimplemented!() macro', () => {
    const code = `fn serialize(&self) -> Vec<u8> {
    unimplemented!()
}`;
    const v = check(rustTodoMacro, code);
    expect(v).toHaveLength(1);
    expect(v[0].message).toContain('unimplemented!()');
  });

  it('passes clean code', () => {
    const code = `fn process() -> Result<()> {
    Ok(())
}`;
    const v = check(rustTodoMacro, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// todo!("later")`;
    const v = check(rustTodoMacro, code);
    expect(v).toHaveLength(0);
  });
});

// ── rust-panic ────────────────────────────────────────────────────

describe('rust-panic', () => {
  it('detects panic! in library code', () => {
    const code = `pub fn process(data: &str) {
    if data.is_empty() {
        panic!("data cannot be empty");
    }
}`;
    const v = check(rustPanic, code);
    expect(v).toHaveLength(1);
    expect(v[0].rule).toBe('rust-panic');
    expect(v[0].message).toContain('panic!()');
  });

  it('passes panic in main.rs', () => {
    const code = `fn main() {
    panic!("fatal error");
}`;
    const v = check(rustPanic, code, 'main.rs');
    expect(v).toHaveLength(0);
  });

  it('passes panic in test code', () => {
    const code = `#[cfg(test)]
mod tests {
    #[test]
    fn it_panics() {
        panic!("expected");
    }
}`;
    const v = check(rustPanic, code);
    expect(v).toHaveLength(0);
  });

  it('passes clean code returning Result', () => {
    const code = `pub fn process(data: &str) -> Result<(), Error> {
    if data.is_empty() {
        return Err(Error::new("data cannot be empty"));
    }
    Ok(())
}`;
    const v = check(rustPanic, code);
    expect(v).toHaveLength(0);
  });

  it('skips comments', () => {
    const code = `// panic!("not real")`;
    const v = check(rustPanic, code);
    expect(v).toHaveLength(0);
  });
});
