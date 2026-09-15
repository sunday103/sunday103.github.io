/**
 * 文章 front-matter 校验脚本
 * ============================================================
 * 解决的问题
 * ------------------------------------------------------------
 * Hexo 遇到 front-matter（文件开头两个 --- 之间的元数据）语法错误时，
 * 【不报错、不警告】，只是静默把整篇文章丢掉。
 * 现象：构建显示成功、exit code = 0，但文章根本没生成，
 *       首页和归档里都找不到，极难排查。
 *
 * 本脚本在每次 hexo generate / server / deploy 之前扫描所有文章，
 * 发现格式错误立即中断构建，并打印文件名、行号和修正建议。
 *
 * 实现说明
 * ------------------------------------------------------------
 * 不依赖 YAML 解析器报错里的行号——实测 Hexo 的 yaml 渲染器会在解析前
 * 多插入一个换行，导致解析器报出的行号整体偏移一行。
 * 因此这里用「逐行扫描 + 关键字判定」自行定位出错行，行号与提示都准确。
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 用 Unicode 转义书写中文标点，避免脚本自身出现全角字符引发编码问题
const CN_COMMA = '\uFF0C'; // ，
const CN_COLON = '\uFF1A'; // ：
const CN_SEMI = '\uFF1B';  // ；
const CN_QUEST = '\uFF1F'; // ？

hexo.extend.filter.register('before_generate', function () {
  const postsDir = path.join(hexo.source_dir, '_posts');
  if (!fs.existsSync(postsDir)) return;

  const errors = [];
  const warnings = [];

  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { collect(full); continue; }
      if (!/\.(md|markdown)$/i.test(entry.name)) continue;
      checkFile(full, errors, warnings);
    }
  };

  collect(postsDir);

  if (warnings.length) {
    hexo.log.warn('\u6587\u7ae0\u683c\u5f0f\u63d0\u9192\uff08\u4e0d\u5f71\u54cd\u6784\u5efa\uff09\uff1a');
    for (const w of warnings) {
      hexo.log.warn(`  ${w.file}`);
      hexo.log.warn(`    ${w.msg}`);
    }
  }

  if (errors.length) {
    hexo.log.error('');
    hexo.log.error('=========================================================');
    hexo.log.error('  \u53d1\u73b0\u6587\u7ae0 front-matter \u683c\u5f0f\u9519\u8bef');
    hexo.log.error('  \u8fd9\u4e9b\u6587\u7ae0\u4f1a\u88ab Hexo \u9759\u9ed8\u4e22\u5f03\uff0c\u4e0d\u4f1a\u51fa\u73b0\u5728\u7f51\u7ad9\u4e0a');
    hexo.log.error('=========================================================');
    for (const e of errors) {
      hexo.log.error(`  \u6587\u4ef6: ${e.file}`);
      hexo.log.error(`  \u4f4d\u7f6e: \u7b2c ${e.line} \u884c`);
      if (e.badLine) hexo.log.error(`  \u8be5\u884c: ${e.badLine.trim()}`);
      hexo.log.error(`  \u539f\u56e0: ${e.msg}`);
      if (e.hint) hexo.log.error(`  \u5efa\u8bae: ${e.hint}`);
      hexo.log.error('');
    }
    throw new Error(
      `\u6709 ${errors.length} \u7bc7\u6587\u7ae0\u7684 front-matter \u683c\u5f0f\u6709\u8bef\uff0c\u5df2\u4e2d\u65ad\u6784\u5efa\u3002`
      + `\u8bf7\u6309\u4e0a\u65b9\u63d0\u793a\u4fee\u6b63\u540e\u91cd\u8bd5\u3002`
    );
  }

  hexo.log.info('\u6587\u7ae0\u6821\u9a8c\u901a\u8fc7\uff08front-matter \u683c\u5f0f\u6b63\u5e38\uff09');
});

// ============================================================
// 单个文件校验
// ============================================================
function checkFile(full, errors, warnings) {
  const rel = path.relative(hexo.base_dir, full).replace(/\\/g, '/');
  const buf = fs.readFileSync(full);

  // ---- 0. 文件编码检查（必须最先做）----
  // 用「严格模式」UTF-8 解码：只要文件里有非法字节序列就会抛错。
  // 最常见的成因是编辑时按 GBK/ANSI 保存（记事本、PowerShell 的
  // Set-Content 都可能），此时中文会变成非法 UTF-8 字节，
  // 表现为网页上出现「�」乱码。
  let raw;
  try {
    raw = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (e) {
    const gbk = looksLikeGbk(buf);
    errors.push({
      file: rel,
      line: 1,
      msg: gbk
        ? '\u6587\u4ef6\u4e0d\u662f\u5408\u6cd5\u7684 UTF-8\uff0c\u7591\u4f3c\u88ab\u4fdd\u5b58\u6210\u4e86 GBK/ANSI \u7f16\u7801'
        : '\u6587\u4ef6\u542b\u975e\u6cd5 UTF-8 \u5b57\u8282\u5e8f\uff0c\u7f16\u7801\u5df2\u635f\u574f',
      hint: '\u7528 VS Code \u6253\u5f00\u8be5\u6587\u4ef6\uff0c\u70b9\u53f3\u4e0b\u89d2\u7684\u7f16\u7801\u6807\u8bc6'
        + '\uff08\u5982 GBK/ANSI\uff09\u9009 Reopen with Encoding \u6539\u4e3a UTF-8'
        + '\uff0c\u786e\u8ba4\u4e2d\u6587\u6b63\u5e38\u540e\u518d\u4fdd\u5b58\u3002'
        + '\u4e0d\u8981\u7528 PowerShell \u7684 Set-Content \u4fdd\u5b58\u3002'
    });
    return;
  }

  // BOM 检查：带 BOM 的 UTF-8 在 YAML 解析时容易出问题
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    warnings.push({
      file: rel,
      msg: '\u6587\u4ef6\u5e26\u6709 UTF-8 BOM\uff08\u5f00\u5934\u4e09\u4e2a\u4e0d\u53ef\u89c1\u5b57\u8282\uff09\uff0c'
        + '\u5efa\u8bae\u4fdd\u5b58\u4e3a\u300cUTF-8\uff08\u4e0d\u5e26 BOM\uff09\u300d'
    });
  }

  // ---- 1. 分隔符 ----
  const m = raw.match(/^(\uFEFF)?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) {
    errors.push({
      file: rel,
      line: 1,
      msg: '\u7f3a\u5c11 front-matter\uff08\u6587\u4ef6\u5f00\u5934\u5e94\u4e3a --- \u5305\u88f9\u7684\u5143\u6570\u636e\u5757\uff09'
    });
    return;
  }

  const fmBody = m[2];
  const fmStartLine = 2;              // front-matter 正文从文件第 2 行开始
  const fmLines = fmBody.split(/\r?\n/);

  // ---- 2. 逐行扫描，定位明显的写法错误 ----
  // 这一步先行，因为它给出的是精确行号（不依赖解析器偏移过的行号）
  const found = findSuspectLine(fmLines, fmStartLine);

  // ---- 3. YAML 合法性 ----
  let parsed = null;
  let parseErr = null;
  try {
    parsed = yaml.load(fmBody);
  } catch (e) {
    parseErr = e;
  }

  if (parseErr) {
    const msg0 = (parseErr.message || '').split('\n')[0];
    if (found) {
      errors.push({ file: rel, line: found.line, badLine: found.text, msg: found.msg, hint: found.hint });
    } else {
      errors.push({ file: rel, line: fmStartLine, msg: msg0 });
    }
    return;
  }

  // 能解析，但存在可疑写法 —— 提示但不中断
  if (found) {
    warnings.push({ file: rel, msg: `\u7b2c ${found.line} \u884c\u770b\u8d77\u6765\u6709\u95ee\u9898\uff1a${found.msg}` });
  }

  if (!parsed || typeof parsed !== 'object') {
    errors.push({
      file: rel,
      line: fmStartLine,
      msg: 'front-matter \u5185\u5bb9\u65e0\u6548\uff08\u672a\u89e3\u6790\u51fa\u4efb\u4f55\u5b57\u6bb5\uff09'
    });
    return;
  }

  // ---- 4. 其余可疑之处 ----
  for (const key of ['tags', 'categories', 'keywords']) {
    const v = parsed[key];
    if (typeof v === 'string' && (v.includes(',') || v.includes(CN_COMMA))) {
      warnings.push({
        file: rel,
        msg: `${key} \u5199\u6210\u4e86\u666e\u901a\u5b57\u7b26\u4e32 "${v}"\u3002`
          + `\u5efa\u8bae\u6539\u6210\u6570\u7ec4\u5199\u6cd5\uff1a${key}: [\u6807\u7b7e1, \u6807\u7b7e2]`
      });
    }
  }
  if (!parsed.title) {
    warnings.push({ file: rel, msg: 'front-matter \u4e2d\u672a\u8bbe\u7f6e title' });
  }

  const body = raw.slice(m[0].length).trim();
  if (!body) {
    warnings.push({ file: rel, msg: '\u6b63\u6587\u4e3a\u7a7a\uff0c\u6587\u7ae0\u9875\u4f1a\u663e\u793a\u4e3a\u7a7a\u767d' });
  }
}

// ============================================================
// 判断字节流是否像 GBK 编码的中文
// ============================================================
// GBK 双字节汉字的范围：
//   首字节 0x81-0xFE，次字节 0x40-0xFE（不含 0x7F）
// UTF-8 汉字的首字节则一定是 0xE4-0xE9 开头、共三字节。
// 这里统计符合 GBK 模式的双字节对数量，超过一定比例就判定为 GBK。
function looksLikeGbk(buf) {
  let pairs = 0;
  let i = 0;
  while (i < buf.length - 1) {
    const b1 = buf[i];
    const b2 = buf[i + 1];
    if (b1 >= 0x81 && b1 <= 0xFE && b2 >= 0x40 && b2 <= 0xFE && b2 !== 0x7F) {
      pairs++;
      i += 2;
      continue;
    }
    i++;
  }
  return pairs >= 2;   // 至少出现两处 GBK 汉字特征才判定
}

// ============================================================
// 逐行找出最可疑的一行，返回精确的文件行号与修正建议
// ============================================================
function findSuspectLine(fmLines, fmStartLine) {
  const keys = 'tags|categories|keywords|title|date|updated|cover|description|top';

  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const absLine = fmStartLine + i;

    // A1) "key:值" —— 冒号后【完全没有空格】，YAML 会把整行当成一个超长键名。
    //     注意：必须是「零个空格」，因为 "key: 值"（一个空格）才是正确写法。
    const noSpace = new RegExp(`^(${keys}):(\\S.*)$`).exec(t);
    if (noSpace) {
      const key = noSpace[1];
      const rest = noSpace[2];
      return {
        line: absLine, text: line,
        msg: '\u5192\u53f7\u540e\u7f3a\u5c11\u7a7a\u683c',
        hint: `\u5e94\u6539\u4e3a\uff1a${key}: [${rest}]\uff08\u591a\u4e2a\u6807\u7b7e\u7528\u82f1\u6587\u9017\u53f7\u5206\u9694\uff09`
      };
    }

    // A2) "key: [...]" 数组写法有问题（例如方括号没闭合）
    const arr = new RegExp(`^(${keys}):[ \\t]+\\[([^\\]]*)$`).exec(t);
    if (arr) {
      return {
        line: absLine, text: line,
        msg: '\u6570\u7ec4\u65b9\u62ec\u53f7\u672a\u95ed\u5408',
        hint: `\u6b63\u786e\u5199\u6cd5\uff1a${arr[1]}: [${arr[2]}]\uff08\u8865\u4e0a\u53f3\u65b9\u62ec\u53f7\uff09`
      };
    }

    // B) 中文字符混入
    if (t.includes(CN_COLON)) {
      return { line: absLine, text: line, msg: '\u51fa\u73b0\u4e2d\u6587\u5192\u53f7', hint: '\u6539\u4e3a\u82f1\u6587\u5192\u53f7 ":"' };
    }
    if (t.includes(CN_COMMA)) {
      return { line: absLine, text: line, msg: '\u51fa\u73b0\u4e2d\u6587\u9017\u53f7', hint: '\u6570\u7ec4\u5185\u6539\u7528\u82f1\u6587\u9017\u53f7 ","' };
    }
    if (t.includes(CN_SEMI) || t.includes(CN_QUEST)) {
      return { line: absLine, text: line, msg: '\u51fa\u73b0\u4e2d\u6587\u6807\u70b9', hint: '\u6539\u4e3a\u5bf9\u5e94\u7684\u82f1\u6587\u6807\u70b9' };
    }

    // C) Tab 缩进
    if (line.includes('\t')) {
      return { line: absLine, text: line, msg: '\u4f7f\u7528\u4e86 Tab \u7f29\u8fdb', hint: 'YAML \u53ea\u5141\u8bb8\u7528\u7a7a\u683c\u7f29\u8fdb' };
    }

    // D) 有缩进但不是列表项 —— 常见于字段没对齐
    if (/^\s+\S/.test(line) && !t.startsWith('-')) {
      return {
        line: absLine, text: line,
        msg: '\u8be5\u884c\u6709\u7f29\u8fdb\uff0c\u4f46\u4e0d\u662f\u5217\u8868\u9879',
        hint: '\u540c\u7ea7\u5b57\u6bb5\u9700\u5de6\u5bf9\u9f50\uff0c\u7f29\u8fdb\u53ea\u7528\u7a7a\u683c'
      };
    }
  }
  return null;
}
