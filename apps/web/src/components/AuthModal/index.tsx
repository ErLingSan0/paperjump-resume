import { useMemo, useState } from 'react';

import { history, useModel } from '@umijs/max';
import { Button, Form, Input, Modal, Typography, message } from 'antd';

import { login, queryCurrentUser, register } from '@/services/auth';
import { getErrorMessage, getErrorStatus } from '@/utils/request';

type AuthMode = 'login' | 'register';

type AuthModalProps = {
  open: boolean;
  mode: AuthMode;
  redirect: string;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
};

export default function AuthModal(props: AuthModalProps) {
  const { open, mode, redirect, onClose, onModeChange } = props;
  const { setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm<{
    email: string;
    password: string;
    displayName?: string;
  }>();
  const [submitting, setSubmitting] = useState(false);

  const actionCopy = useMemo(
    () =>
      mode === 'login'
        ? {
            title: '登录',
            description: '使用邮箱继续。',
            button: '登录',
          }
        : {
            title: '注册',
            description: '创建账号后即可开始使用。',
            button: '注册',
          },
    [mode],
  );

  async function resolveSessionUser() {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const sessionUser = await queryCurrentUser({
          skipErrorHandler: true,
        });

        if (sessionUser) {
          return sessionUser;
        }
      } catch {
        // ignore transient session timing issues and retry shortly
      }

      await new Promise((resolve) => {
        window.setTimeout(resolve, 180);
      });
    }

    return undefined;
  }

  async function handleSubmit(values: {
    email: string;
    password: string;
    displayName?: string;
  }) {
    form.setFields([
      { name: 'email', errors: [] },
      { name: 'password', errors: [] },
      { name: 'displayName', errors: [] },
    ]);
    setSubmitting(true);

    try {
      const currentUser =
        mode === 'login'
          ? await login({
              email: values.email,
              password: values.password,
            })
          : await register({
              email: values.email,
              displayName: values.displayName?.trim() || '',
              password: values.password,
            });
      const sessionUser = await resolveSessionUser();

      await setInitialState((state) => ({
        ...(state ?? {}),
        currentUser: sessionUser || currentUser,
      }));
      message.success(mode === 'login' ? '登录成功' : '注册成功');
      onClose();
      history.replace(redirect || '/resumes');
    } catch (error) {
      const status = getErrorStatus(error);

      if (mode === 'login' && status === 401) {
        form.setFields([
          {
            name: 'password',
            errors: ['邮箱或密码不正确'],
          },
        ]);
        return;
      }

      if (mode === 'login' && status === 403) {
        form.setFields([
          {
            name: 'email',
            errors: ['当前账号不可用，请联系管理员'],
          },
        ]);
        return;
      }

      if (mode === 'register' && status === 409) {
        form.setFields([
          {
            name: 'email',
            errors: ['该邮箱已经注册过了'],
          },
        ]);
        return;
      }

      message.error(
        getErrorMessage(
          error,
          mode === 'login' ? '登录失败，请稍后再试' : '注册失败，请稍后再试',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      destroyOnHidden
      rootClassName="paperjump-auth-modal"
    >
      <div className="paperjump-auth-modal__panel">
        <div className="paperjump-auth-modal__header">
          <Typography.Title level={3}>{actionCopy.title}</Typography.Title>
          <Typography.Paragraph>{actionCopy.description}</Typography.Paragraph>
        </div>

        <div className="paperjump-auth-modal__mode" role="tablist" aria-label="登录注册切换">
          <button
            type="button"
            className={[
              'paperjump-auth-modal__mode-button',
              mode === 'login' ? 'paperjump-auth-modal__mode-button--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="tab"
            aria-selected={mode === 'login'}
            aria-pressed={mode === 'login'}
            onClick={() => onModeChange('login')}
          >
            登录
          </button>
          <button
            type="button"
            className={[
              'paperjump-auth-modal__mode-button',
              mode === 'register' ? 'paperjump-auth-modal__mode-button--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="tab"
            aria-selected={mode === 'register'}
            aria-pressed={mode === 'register'}
            onClick={() => onModeChange('register')}
          >
            注册
          </button>
        </div>

        <Form
          key={mode}
          form={form}
          className="paperjump-auth-modal__form"
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {mode === 'register' ? (
            <Form.Item
              label="昵称"
              name="displayName"
              rules={[
                { required: true, message: '请输入昵称' },
                { max: 64, message: '昵称不能超过 64 个字符' },
              ]}
            >
              <Input placeholder="例如：张三" size="large" />
            </Form.Item>
          ) : null}

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱地址' },
            ]}
          >
            <Input autoComplete="email" placeholder="name@example.com" size="large" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? '输入密码' : '设置至少 6 位密码'}
              size="large"
            />
          </Form.Item>

          <Button type="primary" size="large" block htmlType="submit" loading={submitting}>
            {actionCopy.button}
          </Button>
          <Button type="text" size="large" block onClick={onClose}>
            暂不登录
          </Button>
        </Form>
      </div>
    </Modal>
  );
}
