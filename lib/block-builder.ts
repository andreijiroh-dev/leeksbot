/**
 * SPDX-License-Identifier: MPL-2.0 AND AGPL-3.0
 * 1
 * @module
 * 
 * General utilities for building Slack interactive blocks. Imported from
 * the Prox2 source code at https://github.com/anirudhb/prox2/blob/1b94cdbb3f1ac53316688d98252865daea3e5aa9/lib/block_builder.ts,
 * originally under the AGPL-2.0 license
 * 
 * @license MPL-2.0 AND AGPL-3.0
 */

/**
 * An abstract class for rendering the sections into formatted JSON objects
 * for consumption by Slack's Node SDKs and Bolt.js.
 */
abstract class Renderable {
  abstract render(): any;
}

abstract class Block extends Renderable {
  constructor(protected block_id: string | null = null) {
    super();
  }
}

abstract class Section extends Block { }

abstract class Text extends Renderable { }

export class PlainText extends Text {
  constructor(private text: string, private emoji: boolean = true) {
    super();
  }

  render() {
    let r: any = {
      type: "plain_text",
      text: this.text
    };
    if (this.emoji == true) r.emoji = true;
    return r
  }
}

export class MarkdownText extends Text {
  constructor(private text: string) {
    super();
  }

  render() {
    return {
      type: "mrkdwn",
      text: this.text,
    };
  }
}

/**
 * A image element
 */
export class Image extends Renderable {
  constructor(
    // The image URL
    private url: String,
    // the alt text of the image
    private alttext?: String
  ) {
    super();
  }

  render() {
    return {
      type: "image",
      image_url: this.url,
      alt_text: this.alttext
    }
  }
}

abstract class Action extends Renderable {
  constructor(protected action_id: string) {
    super();
  }
}

abstract class Accessory extends Renderable { }

export class ExternalSelectAction extends Action implements Accessory {
  constructor(
    private placeholder: Text,
    private min_query_length: number,
    action_id: string
  ) {
    super(action_id);
  }

  render() {
    return {
      type: "external_select",
      placeholder: this.placeholder.render(),
      min_query_length: this.min_query_length,
      action_id: this.action_id,
    };
  }
}

export class TextSection extends Section {
  constructor(
    private text: Text,
    block_id: string | null = null,
    private fields: Text[] | null = null,
    private accessory: Accessory | null = null
  ) {
    super(block_id);
  }

  render(): any {
    let r: any = {
      type: "section",
      text: this.text.render(),
      accessory: this.accessory?.render(),
    };
    if (this.block_id != null) r.block_id = this.block_id;
    if (this.fields != null) r.fields = this.fields?.map((field) => field.render())
    return r;
  }
}

/**
 * Create a divider section to visually separates pieces of info inside of a message.
 * 
 * https://api.slack.com/reference/block-kit/blocks#divider
 */
export class DividerSection extends Section {
  constructor(
    block_id?: string
  ) {
    super(block_id)
  }

  render(): any {
    let r: any = {
      type: "divider"
    }
    return r
  }
}

/**
 * Creates a header block. Requires the use of {@linkcode PlainText}.
 * 
 * ```ts
 * import { HeaderSection, PlainText } from "./block-builder" // or "https://mau.dev/andreijiroh-dev/leeksbot/raw/main/lib/block-builder.ts"
 * 
 * const header = new HeaderSection(new PlainText("hellowo"));
 * console.log(header);
 * ```
 * 
 * https://api.slack.com/reference/block-kit/blocks#header
 */
export class HeaderSection extends Section {
  constructor(
    private text: Text,
    block_id: string | null = null,
  ) {
    super(block_id);
  }

  render() {
    let r: any = {
      type: "header",
      text: this.text.render()
    }
    return r
  }
}

abstract class Input extends Renderable { }

export class PlainTextInput extends Input {
  constructor(private action_id: string, private multiline: boolean = false) {
    super();
  }

  render(): any {
    return {
      type: "plain_text_input",
      multiline: this.multiline,
      action_id: this.action_id,
    };
  }
}

export class InputSection extends Section {
  constructor(
    private input: Input,
    private label: Text,
    block_id: string | null = null
  ) {
    super(block_id);
  }

  render(): any {
    return {
      type: "input",
      element: this.input.render(),
      label: this.label.render(),
      block_id: this.block_id,
    };
  }
}

export class ButtonAction extends Action {
  constructor(
    private text: PlainText,
    private value: string,
    action_id: string
  ) {
    super(action_id);
  }

  render(): any {
    return {
      type: "button",
      text: this.text.render(),
      value: this.value,
      action_id: this.action_id,
    };
  }
}

export class ActionsSection extends Section {
  constructor(private actions: Action[]) {
    super();
  }

  render(): any {
    return {
      type: "actions",
      elements: this.actions.map((action) => action.render()),
    };
  }
}

export class ContextSection extends Section {
  constructor(private elements: Text[] | Image[]) {
    super();
  }

  render() {
    return {
      type: "context",
      elements: this.elements.map((element) => element.render())
    }
  }
}

export class Blocks extends Renderable {
  constructor(private sections: Block[]) {
    super();
  }

  render(): any {
    return this.sections.map((section) => section.render());
  }
}